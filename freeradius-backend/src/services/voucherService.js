// src/services/voucherService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const { addDays, format } = require('date-fns');

const VOUCHER_ORG_NAME = "Voucher";

function generateRandomString(length, type = 'alnum') {
    let chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    if (type === 'numeric') {
        chars = '0123456789';
    }
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ... (ฟังก์ชันอื่นๆ ที่ไม่เปลี่ยนแปลง)

const createVoucherPackage = async (packageData) => {
    return prisma.VoucherPackage.create({ data: packageData });
};

const getAllVoucherPackages = async () => {
    return prisma.VoucherPackage.findMany({ include: { radiusProfile: true } });
};

const updateVoucherPackage = async (id, packageData) => {
    return prisma.VoucherPackage.update({
        where: { id: parseInt(id) },
        data: packageData,
    });
};

const deleteVoucherPackage = async (id) => {
    return prisma.VoucherPackage.delete({ where: { id: parseInt(id) } });
};

const getVoucherBatches = async (filters = {}) => {
    const { page = 1, pageSize = 10, searchTerm, packageId, adminId, startDate, endDate } = filters;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);
    const whereClause = {};

    if (searchTerm) {
        whereClause.OR = [
            { packageName: { contains: searchTerm } },
            { batchIdentifier: { contains: searchTerm } },
            { createdBy: { fullName: { contains: searchTerm } } },
            { createdBy: { username: { contains: searchTerm } } },
        ];
    }
    
    if (packageId) whereClause.packageName = { equals: (await prisma.VoucherPackage.findUnique({ where: { id: parseInt(packageId) } }))?.name };
    if (adminId) whereClause.createdById = parseInt(adminId);

    if (startDate) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt = { gte: start, lte: end };
    }

    const [batches, totalBatches] = await prisma.$transaction([
        prisma.VoucherBatch.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { fullName: true, username: true } } },
            skip,
            take,
        }),
        prisma.VoucherBatch.count({ where: whereClause }),
    ]);

    return {
        batches,
        totalBatches,
        totalPages: Math.ceil(totalBatches / take),
        currentPage: parseInt(page),
    };
};

const getVoucherBatchById = async (id) => {
    const batch = await prisma.VoucherBatch.findUnique({
        where: { id: parseInt(id) },
    });

    if (!batch) return null;

    const voucherPackage = await prisma.VoucherPackage.findUnique({
        where: { name: batch.packageName },
    });

    const durationDays = voucherPackage ? voucherPackage.durationDays : 0;

    return {
        ...batch,
        usersJson: JSON.parse(batch.usersJson),
        durationDays: durationDays,
    };
};

const generateVouchers = async (options, adminId) => {
    const {
        quantity,
        packageId,
        usernamePrefix,
        passwordType,
        usernameLength,
        passwordLength
    } = options;

    const numQuantity = parseInt(quantity, 10);
    const saltRounds = 10;
    
    // --- START: ส่วนที่แก้ไข ---

    // 1. ดึงข้อมูลที่จำเป็นนอก Transaction
    const voucherPackage = await prisma.VoucherPackage.findUnique({
        where: { id: parseInt(packageId) },
        include: { radiusProfile: true },
    });

    if (!voucherPackage) throw new Error("Package not found");

    let voucherOrg = await prisma.organization.findUnique({ where: { name: VOUCHER_ORG_NAME } });
    if (!voucherOrg) {
        voucherOrg = await prisma.organization.create({
            data: {
                name: VOUCHER_ORG_NAME,
                login_identifier_type: 'manual',
                radiusProfileId: voucherPackage.radiusProfileId,
            }
        });
    }

    // 2. ดึงชื่อผู้ใช้ที่มี prefix เดียวกันทั้งหมดมาเก็บไว้ก่อน เพื่อลดการ query ฐานข้อมูลใน loop
    const existingUsers = await prisma.user.findMany({
        where: { username: { startsWith: usernamePrefix } },
        select: { username: true }
    });
    const existingUsernames = new Set(existingUsers.map(u => u.username));
    
    // 3. สร้างข้อมูล User และ "เข้ารหัสผ่านทั้งหมด" พร้อมตรวจสอบการซ้ำ
    const usersToCreate = [];
    for (let i = 0; i < numQuantity; i++) {
        let username;
        let isUnique = false;
        
        // Loop จนกว่าจะได้ Username ที่ไม่ซ้ำ
        while (!isUnique) {
            const usernameRandomPart = generateRandomString(parseInt(usernameLength), 'alnum');
            username = `${usernamePrefix}${usernameRandomPart}`;
            // ตรวจสอบทั้งใน DB ที่ดึงมา และใน Batch ที่กำลังจะสร้าง
            if (!existingUsernames.has(username)) {
                isUnique = true;
            }
        }
        
        const password = generateRandomString(parseInt(passwordLength), passwordType);
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        usersToCreate.push({ username, password, hashedPassword });
        existingUsernames.add(username); // เพิ่ม Username ใหม่เข้าไปใน Set เพื่อป้องกันการซ้ำในรอบถัดไป
    }

    // 4. เตรียมข้อมูลสำหรับใส่ใน Database แบบ Bulk
    const expirationDate = addDays(new Date(), voucherPackage.durationDays);
    const formattedExpiration = format(expirationDate, 'dd MMM yyyy HH:mm:ss');
    
    const userDataForDb = usersToCreate.map(user => ({
        username: user.username,
        password: user.hashedPassword,
        full_name: `Voucher User - ${voucherPackage.name}`,
        organizationId: voucherOrg.id,
        status: 'active',
    }));

    const radCheckDataForDb = usersToCreate.flatMap(user => [
        {
            username: user.username,
            attribute: 'Crypt-Password',
            op: ':=',
            value: user.hashedPassword,
        },
        {
            username: user.username,
            attribute: 'Expiration',
            op: ':=',
            value: formattedExpiration,
        }
    ]);

    const radUserGroupDataForDb = usersToCreate.map(user => ({
        username: user.username,
        groupname: voucherPackage.radiusProfile.name,
        priority: 10,
    }));
    
    // 5. ทำงานกับฐานข้อมูลใน Transaction เดียว โดยใช้ createMany เพื่อความรวดเร็ว
    await prisma.$transaction(async (tx) => {
        await tx.user.createMany({ data: userDataForDb });
        await tx.radcheck.createMany({ data: radCheckDataForDb });
        await tx.radusergroup.createMany({ data: radUserGroupDataForDb });
    }, {
      timeout: 30000, // 30 วินาที
    });

    // --- END: สิ้นสุดส่วนที่แก้ไข ---

    const batchIdentifier = `BATCH-${Date.now()}`;
    const newBatch = await prisma.VoucherBatch.create({
        data: {
            batchIdentifier,
            quantity: numQuantity,
            packageName: voucherPackage.name,
            usernamePrefix,
            passwordType,
            usersJson: JSON.stringify(usersToCreate.map(u => ({ username: u.username, password: u.password }))),
            createdById: adminId,
        },
    });

    return newBatch;
};

module.exports = {
    createVoucherPackage,
    getAllVoucherPackages,
    updateVoucherPackage,
    deleteVoucherPackage,
    generateVouchers,
    getVoucherBatches,
    getVoucherBatchById,
};