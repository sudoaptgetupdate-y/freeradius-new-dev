// src/services/onlineUserService.js
const prisma = require('../prisma');

const adjustToLocalTime = (utcDate) => {
    if (!utcDate) return null;
    return new Date(utcDate.getTime() - (7 * 60 * 60 * 1000));
};

const getOnlineUsers = async (filters = {}) => {
  const { 
    page = 1, 
    pageSize = 15, 
    searchTerm, 
    organizationId,
    sortBy = 'logintime',
    sortOrder = 'desc'
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const whereClause = {
    acctstoptime: null,
  };

  if (searchTerm) {
    whereClause.OR = [
      { username: { contains: searchTerm } },
      { framedipaddress: { contains: searchTerm } },
      { callingstationid: { contains: searchTerm } },
    ];
  }

  if (organizationId) {
    const usersInOrg = await prisma.user.findMany({
      where: { organizationId: parseInt(organizationId) },
      select: { username: true },
    });
    const usernamesInOrg = usersInOrg.map(u => u.username);

    if (usernamesInOrg.length === 0) {
      return { users: [], totalRecords: 0, totalPages: 0, currentPage: parseInt(page) };
    }
    
    whereClause.username = {
      in: usernamesInOrg,
    };
  }

  let orderBy = {};
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'logintime':
        orderBy = { acctstarttime: order };
        break;
    case 'duration':
        orderBy = { acctstarttime: order };
        break;
    case 'dataup':
        orderBy = { acctoutputoctets: order };
        break;
    case 'datadown':
        orderBy = { acctinputoctets: order };
        break;
    default:
        orderBy = { acctstarttime: 'desc' };
  }

  const [onlineSessions, totalRecords] = await prisma.$transaction([
    prisma.radacct.findMany({
      where: whereClause,
      select: {
        radacctid: true,
        username: true,
        framedipaddress: true,
        acctstarttime: true,
        callingstationid: true,
        acctinputoctets: true,
        acctoutputoctets: true,
        nasipaddress: true,
        acctsessionid: true,
      },
      orderBy,
      skip,
      take,
    }),
    prisma.radacct.count({ where: whereClause }),
  ]);

  const usernames = onlineSessions.map(session => session.username);
  const usersData = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { username: true, full_name: true },
  });
  
  const userMap = new Map(usersData.map(u => [u.username, u.full_name]));

  let combinedData = onlineSessions.map(session => ({
    ...session,
    radacctid: session.radacctid.toString(),
    acctinputoctets: session.acctinputoctets ? session.acctinputoctets.toString() : '0',
    acctoutputoctets: session.acctoutputoctets ? session.acctoutputoctets.toString() : '0',
    full_name: userMap.get(session.username) || 'N/A',
    acctstarttime: adjustToLocalTime(session.acctstarttime),
  }));

  if (sortBy === 'totaldata') {
    combinedData.sort((a, b) => {
        const totalA = BigInt(a.acctinputoctets) + BigInt(a.acctoutputoctets);
        const totalB = BigInt(b.acctinputoctets) + BigInt(b.acctoutputoctets);
        if (sortOrder === 'desc') {
            return totalB > totalA ? 1 : -1;
        }
        return totalA > totalB ? 1 : -1;
    });
  }

  return {
    users: combinedData,
    totalRecords,
    totalPages: Math.ceil(totalRecords / take),
    currentPage: parseInt(page),
  };
};

const clearStaleSessions = async () => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.radacct.updateMany({
    where: {
      acctstoptime: null,
      acctstarttime: {
        lt: twentyFourHoursAgo,
      },
    },
    data: {
      acctstoptime: new Date(),
      acctterminatecause: 'Admin-Reset',
    },
  });

  return { clearedCount: result.count };
};

module.exports = {
  getOnlineUsers,
  clearStaleSessions,
};