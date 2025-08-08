// src/services/voucherService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const { addDays, format } = require('date-fns');

const VOUCHER_ORG_NAME = "Voucher";

function generatePassword(length = 6) {    
    // ... (ฟังก์ชันนี้คงเดิม)
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ... (ฟังก์ชัน create, get, update, delete package และอื่นๆ คงเดิม) ...
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
    if (batch) {
        batch.usersJson = JSON.parse(batch.usersJson);
    }
    return batch;
};


const generateVouchers = async (options, adminId) => {
    const { quantity, packageId, usernamePrefix, passwordType } = options;

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
    
    // --- START: แก้ไขส่วนนี้ ---
    const numQuantity = parseInt(quantity, 10); // แปลง quantity ให้เป็นตัวเลข
    // --- END ---

    const usersToCreate = [];
    for (let i = 0; i < numQuantity; i++) { // <-- ใช้ตัวแปรที่แปลงค่าแล้ว
        const username = `${usernamePrefix}${generatePassword(6)}`;
        const password = generatePassword(6);
        usersToCreate.push({ username, password });
    }
    
    const saltRounds = 10;

    await prisma.$transaction(async (tx) => {
        // ... (ส่วน Transaction สำหรับสร้าง user ใน radcheck, radusergroup คงเดิม) ...
        for (const user of usersToCreate) {
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
            await tx.user.create({
                data: {
                    username: user.username,
                    password: hashedPassword,
                    full_name: `Voucher User - ${voucherPackage.name}`,
                    organizationId: voucherOrg.id,
                    status: 'active',
                },
            });

            await tx.radcheck.create({
                data: {
                    username: user.username,
                    attribute: 'Crypt-Password',
                    op: ':=',
                    value: hashedPassword,
                },
            });
            
            const expirationDate = addDays(new Date(), voucherPackage.durationDays);
            const formattedExpiration = format(expirationDate, 'dd MMM yyyy HH:mm:ss');

             await tx.radcheck.create({
                data: {
                    username: user.username,
                    attribute: 'Expiration',
                    op: ':=',
                    value: formattedExpiration,
                },
            });

            await tx.radusergroup.create({
                data: {
                    username: user.username,
                    groupname: voucherPackage.radiusProfile.name,
                    priority: 10,
                },
            });
        }
    });

    const batchIdentifier = `BATCH-${Date.now()}`;
    const newBatch = await prisma.VoucherBatch.create({
        data: {
            batchIdentifier,
            quantity: numQuantity, // <-- ใช้ตัวแปรที่แปลงค่าแล้ว
            packageName: voucherPackage.name,
            usernamePrefix,
            passwordType,
            usersJson: JSON.stringify(usersToCreate),
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