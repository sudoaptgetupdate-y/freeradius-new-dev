// src/services/voucherService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const VOUCHER_ORG_NAME = "Voucher";

function generatePassword(length = 6) {    
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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

const getVoucherBatches = async () => {
    return prisma.VoucherBatch.findMany({
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { fullName: true, username: true } } },
    });
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
    
    const usersToCreate = [];
    for (let i = 0; i < quantity; i++) {
        const username = `${usernamePrefix}${generatePassword(6)}`;
        const password = generatePassword(6);
        usersToCreate.push({ username, password });
    }
    
    const saltRounds = 10;

    await prisma.$transaction(async (tx) => {
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
             await tx.radcheck.create({
                data: {
                    username: user.username,
                    attribute: 'Expiration',
                    op: ':=',
                    value: `${voucherPackage.durationDays}d`,
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
            quantity,
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