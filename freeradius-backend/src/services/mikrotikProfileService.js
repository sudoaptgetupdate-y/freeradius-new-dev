// freeradius-backend/src/services/mikrotikProfileService.js
const prisma = require('../prisma');

const translateAndApplyAttributes = async (tx, profileName, data) => {
    const {
        rateLimit,
        sessionTimeout,
        idleTimeout,
        sharedUsers,
        acctInterimInterval
    } = data;

    // Clear old attributes for this profile to ensure a clean slate
    await tx.radGroupReply.deleteMany({ where: { groupname: profileName } });
    await tx.radGroupCheck.deleteMany({ where: { groupname: profileName } });

    const attributesToCreate = { reply: [], check: [] };

    // Translate to Reply Attributes
    if (rateLimit) attributesToCreate.reply.push({ attribute: 'Mikrotik-Rate-Limit', value: rateLimit });
    if (sessionTimeout) attributesToCreate.reply.push({ attribute: 'Session-Timeout', value: String(sessionTimeout) });
    if (idleTimeout) attributesToCreate.reply.push({ attribute: 'Idle-Timeout', value: String(idleTimeout) });
    if (acctInterimInterval) attributesToCreate.reply.push({ attribute: 'Acct-Interim-Interval', value: String(acctInterimInterval) });

    // Translate to Check Attributes
    if (sharedUsers) attributesToCreate.check.push({ attribute: 'Simultaneous-Use', value: String(sharedUsers) });
    
    // Batch create attributes
    if (attributesToCreate.reply.length > 0) {
        await tx.radGroupReply.createMany({
            data: attributesToCreate.reply.map(attr => ({ ...attr, groupname: profileName, op: ':=' })),
        });
    }
    if (attributesToCreate.check.length > 0) {
        await tx.radGroupCheck.createMany({
            data: attributesToCreate.check.map(attr => ({ ...attr, groupname: profileName, op: ':=' })),
        });
    }
};

const createMikrotikProfile = async (data) => {
    const { name } = data;
    if (!name) throw new Error('Profile name is required.');

    return prisma.$transaction(async (tx) => {
        const newProfile = await tx.radiusProfile.create({
            data: { name, description: `Mikrotik Profile - ${name}` },
        });
        await translateAndApplyAttributes(tx, name, data);
        return newProfile;
    });
};

const updateMikrotikProfile = async (id, data) => {
    const profileId = parseInt(id, 10);
    const { name } = data;
    
    return prisma.$transaction(async (tx) => {
        const existingProfile = await tx.radiusProfile.findUnique({ where: { id: profileId } });
        if (!existingProfile) throw new Error('Profile not found.');

        // If name changes, we need to update the groupname reference everywhere
        if (name && name !== existingProfile.name) {
            await tx.radGroupReply.updateMany({ where: { groupname: existingProfile.name }, data: { groupname: name } });
            await tx.radGroupCheck.updateMany({ where: { groupname: existingProfile.name }, data: { groupname: name } });
        }
        
        const updatedProfile = await tx.radiusProfile.update({
            where: { id: profileId },
            data: { name, description: `Mikrotik Profile - ${name}` },
        });

        await translateAndApplyAttributes(tx, name, data);
        return updatedProfile;
    });
};

const getMikrotikProfiles = async () => {
    // This function can reuse the existing service logic for simplicity
    const profiles = await prisma.radiusProfile.findMany({
        orderBy: { name: 'asc' },
        include: {
            replyAttributes: true,
            checkAttributes: true,
        },
    });
    // Convert attributes into a simpler format for the frontend
    return profiles.map(p => {
        const findAttr = (type, attrName) => {
            const list = type === 'reply' ? p.replyAttributes : p.checkAttributes;
            return list.find(a => a.attribute === attrName)?.value;
        };
        return {
            id: p.id,
            name: p.name,
            rateLimit: findAttr('reply', 'Mikrotik-Rate-Limit'),
            sessionTimeout: findAttr('reply', 'Session-Timeout'),
            idleTimeout: findAttr('reply', 'Idle-Timeout'),
            sharedUsers: findAttr('check', 'Simultaneous-Use'),
            acctInterimInterval: findAttr('reply', 'Acct-Interim-Interval'),
        };
    });
};


module.exports = {
    createMikrotikProfile,
    updateMikrotikProfile,
    getMikrotikProfiles,
};