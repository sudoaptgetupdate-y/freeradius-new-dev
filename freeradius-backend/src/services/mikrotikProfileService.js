const prisma = require('../prisma');

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
        if (rateLimit) {
            attributes.push({ profileId: profile.id, attribute: 'Mikrotik-Rate-Limit', op: ':=', value: rateLimit, type: 'reply' });
        }
        if (sessionTimeout) {
            attributes.push({ profileId: profile.id, attribute: 'Session-Timeout', op: ':=', value: sessionTimeout.toString(), type: 'reply' });
        }
        if (idleTimeout) {
            attributes.push({ profileId: profile.id, attribute: 'Idle-Timeout', op: ':=', value: idleTimeout.toString(), type: 'reply' });
        }
        if (acctInterimInterval) {
            attributes.push({ profileId: profile.id, attribute: 'Acct-Interim-Interval', op: ':=', value: acctInterimInterval.toString(), type: 'reply' });
        }
        if (sharedUsers) {
            attributes.push({ profileId: profile.id, attribute: 'Simultaneous-Use', op: ':=', value: sharedUsers.toString(), type: 'check' });
        }

        for (const attr of attributes) {
            if (attr.type === 'reply') {
                await tx.radiusReplyAttribute.create({ data: attr });
            } else {
                await tx.radiusCheckAttribute.create({ data: attr });
            }
        }

        return profile;
    });
};

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
            include: {
                replyAttributes: true,
                checkAttributes: true,
            },
            skip,
            take,
        }),
        prisma.radiusProfile.count({ where: whereClause }),
    ]);

    const formattedProfiles = profiles.map(p => {
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
        const updatedProfile = await tx.radiusProfile.update({
            where: { id: profileId },
            data: {
                name,
                description: `Mikrotik Profile - ${name}`,
            },
        });

        // Clear existing attributes
        await tx.radiusReplyAttribute.deleteMany({ where: { profileId } });
        await tx.radiusCheckAttribute.deleteMany({ where: { profileId } });

        // Add new attributes
        const attributes = [];
        if (rateLimit) {
            attributes.push({ profileId, attribute: 'Mikrotik-Rate-Limit', op: ':=', value: rateLimit, type: 'reply' });
        }
        if (sessionTimeout) {
            attributes.push({ profileId, attribute: 'Session-Timeout', op: ':=', value: sessionTimeout.toString(), type: 'reply' });
        }
        if (idleTimeout) {
            attributes.push({ profileId, attribute: 'Idle-Timeout', op: ':=', value: idleTimeout.toString(), type: 'reply' });
        }
        if (acctInterimInterval) {
            attributes.push({ profileId, attribute: 'Acct-Interim-Interval', op: ':=', value: acctInterimInterval.toString(), type: 'reply' });
        }
        if (sharedUsers) {
            attributes.push({ profileId, attribute: 'Simultaneous-Use', op: ':=', value: sharedUsers.toString(), type: 'check' });
        }
        
        for (const attr of attributes) {
            if (attr.type === 'reply') {
                await tx.radiusReplyAttribute.create({ data: attr });
            } else {
                await tx.radiusCheckAttribute.create({ data: attr });
            }
        }
        
        return updatedProfile;
    });
};


module.exports = {
    createMikrotikProfile,
    getMikrotikProfiles,
    updateMikrotikProfile
};