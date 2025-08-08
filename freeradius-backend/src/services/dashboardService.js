// src/services/dashboardService.js
const prisma = require('../prisma');
const { getFreeradiusStatus } = require('./statusService');
const { startOfHour, subHours, startOfDay, subDays, startOfWeek, subWeeks, startOfMonth, subMonths, format } = require('date-fns');

const adjustToLocalTime = (utcDate) => {
    if (!utcDate) return null;
    return new Date(utcDate.getTime() - (7 * 60 * 60 * 1000));
};

const getOnlineUsersGraph = async (period = 'day') => {
    // This function does not deal with specific timestamps, so it remains unchanged.
    const now = new Date();
    let timeBuckets = [];
    let labelFormat;

    switch (period) {
        case 'day':
            labelFormat = 'HH:00';
            for (let i = 23; i >= 0; i--) {
                const timePoint = startOfHour(subHours(now, i));
                timeBuckets.push({ start: timePoint, label: format(timePoint, labelFormat) });
            }
            break;
        case 'week':
            labelFormat = 'EEE';
            for (let i = 6; i >= 0; i--) {
                const timePoint = startOfDay(subDays(now, i));
                timeBuckets.push({ start: timePoint, label: format(timePoint, labelFormat) });
            }
            break;
        case 'month':
            labelFormat = 'MMM d';
            for (let i = 3; i >= 0; i--) {
                const timePoint = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
                timeBuckets.push({ start: timePoint, label: format(timePoint, labelFormat) });
            }
            break;
        case 'year':
            labelFormat = 'MMM';
            for (let i = 11; i >= 0; i--) {
                const timePoint = startOfMonth(subMonths(now, i));
                timeBuckets.push({ start: timePoint, label: format(timePoint, labelFormat) });
            }
            break;
    }

    const dataPromises = timeBuckets.map(async (bucket, index) => {
        const nextBucket = timeBuckets[index + 1];
        const bucketEnd = nextBucket ? nextBucket.start : new Date();

        const count = await prisma.radacct.count({
            where: {
                acctstarttime: { lt: bucketEnd },
                OR: [
                    { acctstoptime: { gte: bucket.start } },
                    { acctstoptime: null }
                ],
            }
        });

        return { time: bucket.label, value: count };
    });

    return Promise.all(dataPromises);
};

const getDashboardData = async () => {
    const onlineUsersCount = await prisma.radacct.count({ where: { acctstoptime: null } });
    const totalUsersCount = await prisma.user.count();
    const totalOrgsCount = await prisma.organization.count();
    const totalNasCount = await prisma.nas.count();
    const serviceStatus = await getFreeradiusStatus();

    const recentLogins = await prisma.radacct.findMany({
        where: { acctstarttime: { not: null } },
        orderBy: { acctstarttime: 'desc' },
        take: 5,
        select: {
            username: true,
            framedipaddress: true,
            acctstarttime: true,
        }
    });
    
    const usernames = recentLogins.map(l => l.username);
    const usersData = await prisma.user.findMany({
        where: { username: { in: usernames } },
        select: { username: true, full_name: true }
    });
    const userMap = new Map(usersData.map(u => [u.username, u.full_name]));

    const enrichedRecentLogins = recentLogins.map(l => ({
        ...l,
        full_name: userMap.get(l.username) || 'N/A',
        acctstarttime: adjustToLocalTime(l.acctstarttime),
    }));


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const topUsersToday = await prisma.radacct.groupBy({
        by: ['username'],
        where: { acctstarttime: { gte: today } },
        _sum: {
            acctinputoctets: true,
            acctoutputoctets: true,
        },
        orderBy: {
            _sum: {
                acctinputoctets: 'desc',
            },
        },
    });

    const topUsersWithTotal = topUsersToday.map(u => ({
        username: u.username,
        total_data: (u._sum.acctinputoctets || 0n) + (u._sum.acctoutputoctets || 0n)
    })).sort((a, b) => (b.total_data > a.total_data) ? 1 : -1)
    .slice(0, 5);
    
    const topUsernames = topUsersWithTotal.map(u => u.username);
    const topUsersInfo = await prisma.user.findMany({
        where: { username: { in: topUsernames }},
        select: { username: true, full_name: true, organization: { select: { name: true } } }
    });
    const topUserInfoMap = new Map(topUsersInfo.map(u => [u.username, { full_name: u.full_name, org_name: u.organization.name }]));

    const enrichedTopUsers = topUsersWithTotal.map(u => ({
        ...u,
        ...topUserInfoMap.get(u.username),
        total_data: u.total_data.toString()
    }));

    return {
        summary: {
            onlineUsers: onlineUsersCount,
            totalUsers: totalUsersCount,
            totalOrgs: totalOrgsCount,
            totalNas: totalNasCount,
            serviceStatus: serviceStatus.status,
        },
        recentLogins: enrichedRecentLogins,
        topUsersToday: enrichedTopUsers,
    };
};

module.exports = {
  getDashboardData,
  getOnlineUsersGraph,
};