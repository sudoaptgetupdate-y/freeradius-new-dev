// src/services/dashboardService.js
const prisma = require('../prisma');
const { getFreeradiusStatus } = require('./statusService');

const getDashboardData = async () => {
    // 1. Summary Cards Data
    const onlineUsersCount = await prisma.radacct.count({ where: { acctstoptime: null } });
    const totalUsersCount = await prisma.user.count();
    const totalOrgsCount = await prisma.organization.count();
    const totalNasCount = await prisma.nas.count();
    const serviceStatus = await getFreeradiusStatus();

    // 2. Recent Logins
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
    
    // Enrich recent logins with full_name
    const usernames = recentLogins.map(l => l.username);
    const usersData = await prisma.user.findMany({
        where: { username: { in: usernames } },
        select: { username: true, full_name: true }
    });
    const userMap = new Map(usersData.map(u => [u.username, u.full_name]));
    const enrichedRecentLogins = recentLogins.map(l => ({
        ...l,
        full_name: userMap.get(l.username) || 'N/A'
    }));


    // 3. Top 5 Users by Data Usage (Today)
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
                acctinputoctets: 'desc', // Just an example, we'll sum them up below
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
};