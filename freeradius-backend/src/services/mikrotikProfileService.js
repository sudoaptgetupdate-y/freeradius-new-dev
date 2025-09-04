const prisma = require('../prisma');

// === CREATE PROFILE ===
const createMikrotikProfile = async (profileData) => {
    const {
        name,
        rateLimit,
        sessionTimeout,
        idleTimeout,
        sharedUsers,
        acctInterimInterval
    } = profileData;

    return prisma.$transaction(async (tx) => {
        const profile = await tx.radiusProfile.create({
            data: {
                name,
                description: `Mikrotik Profile - ${name}`,
            },
        });

        const attributes = [];
        if (rateLimit) attributes.push({ groupname: name, attribute: 'Mikrotik-Rate-Limit', op: ':=', value: rateLimit, type: 'reply' });
        if (sessionTimeout) attributes.push({ groupname: name, attribute: 'Session-Timeout', op: ':=', value: String(sessionTimeout), type: 'reply' });
        if (idleTimeout) attributes.push({ groupname: name, attribute: 'Idle-Timeout', op: ':=', value: String(idleTimeout), type: 'reply' });
        if (acctInterimInterval) attributes.push({ groupname: name, attribute: 'Acct-Interim-Interval', op: ':=', value: String(acctInterimInterval), type: 'reply' });
        if (sharedUsers) attributes.push({ groupname: name, attribute: 'Simultaneous-Use', op: ':=', value: String(sharedUsers), type: 'check' });

        for (const attr of attributes) {
            const { type, ...data } = attr;
            if (type === 'reply') {
                await tx.radGroupReply.create({ data });
            } else {
                await tx.radGroupCheck.create({ data });
            }
        }

        return profile;
    });
};

// === GET ALL PROFILES ===
const getMikrotikProfiles = async (filters = {}) => {
    const { searchTerm, page = 1, pageSize = 10 } = filters;
    const whereClause = {
        description: {
            startsWith: 'Mikrotik Profile -'
        }
    };

    if (searchTerm) {
        whereClause.OR = [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const [profiles, totalItems] = await prisma.$transaction([
        prisma.radiusProfile.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            // ✅ CORRECTED: Use the relation field names from the schema
            include: {
                replyAttributes: true,
                checkAttributes: true,
            },
            skip,
            take,
        }),
        prisma.radiusProfile.count({ where: whereClause }),
    ]);

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ Frontend ต้องการ
    const formattedProfiles = profiles.map(p => {
        // ✅ CORRECTED: Access relations via the correct field names
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

    return {
        profiles: formattedProfiles,
        totalItems,
        totalPages: Math.ceil(totalItems / take),
        currentPage: parseInt(page),
    };
};

// === UPDATE PROFILE ===
const updateMikrotikProfile = async (profileId, profileData) => {
    const {
        name,
        rateLimit,
        sessionTimeout,
        idleTimeout,
        sharedUsers,
        acctInterimInterval
    } = profileData;

    return prisma.$transaction(async (tx) => {
        const existingProfile = await tx.radiusProfile.findUnique({
            where: { id: profileId },
        });

        if (!existingProfile) {
            throw new Error('Profile not found.');
        }

        const oldGroupName = existingProfile.name;

        const updatedProfile = await tx.radiusProfile.update({
            where: { id: profileId },
            data: {
                name,
                description: `Mikrotik Profile - ${name}`,
            },
        });

        await tx.radGroupReply.deleteMany({ where: { groupname: oldGroupName } });
        await tx.radGroupCheck.deleteMany({ where: { groupname: oldGroupName } });

        const attributes = [];
        if (rateLimit) attributes.push({ groupname: name, attribute: 'Mikrotik-Rate-Limit', op: ':=', value: rateLimit, type: 'reply' });
        if (sessionTimeout) attributes.push({ groupname: name, attribute: 'Session-Timeout', op: ':=', value: String(sessionTimeout), type: 'reply' });
        if (idleTimeout) attributes.push({ groupname: name, attribute: 'Idle-Timeout', op: ':=', value: String(idleTimeout), type: 'reply' });
        if (acctInterimInterval) attributes.push({ groupname: name, attribute: 'Acct-Interim-Interval', op: ':=', value: String(acctInterimInterval), type: 'reply' });
        if (sharedUsers) attributes.push({ groupname: name, attribute: 'Simultaneous-Use', op: ':=', value: String(sharedUsers), type: 'check' });
        
        for (const attr of attributes) {
            const { type, ...data } = attr;
            if (type === 'reply') {
                await tx.radGroupReply.create({ data });
            } else {
                await tx.radGroupCheck.create({ data });
            }
        }
        
        return updatedProfile;
    });
};

// === DELETE PROFILE ===
const deleteMikrotikProfile = async (profileId) => {
    return prisma.$transaction(async (tx) => {
        const profileToDelete = await tx.radiusProfile.findUnique({
            where: { id: profileId },
        });

        if (!profileToDelete) {
            throw new Error('Profile not found.');
        }

        const groupNameToDelete = profileToDelete.name;

        await tx.radGroupReply.deleteMany({ where: { groupname: groupNameToDelete } });
        await tx.radGroupCheck.deleteMany({ where: { groupname: groupNameToDelete } });
        
        await tx.radiusProfile.delete({
            where: { id: profileId },
        });

        return { message: 'Profile deleted successfully.' };
    });
};

module.exports = {
    createMikrotikProfile,
    getMikrotikProfiles,
    updateMikrotikProfile,
    deleteMikrotikProfile
};