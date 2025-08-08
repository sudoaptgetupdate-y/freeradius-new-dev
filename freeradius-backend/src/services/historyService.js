// src/services/historyService.js
const prisma = require('../prisma');

// ฟังก์ชันสำหรับปรับแก้เวลา
const adjustToLocalTime = (utcDate) => {
    if (!utcDate) return null;
    // Prisma อ่านเวลา Local จาก DB (ที่ไม่มี Timezone) แต่เข้าใจผิดว่าเป็น UTC
    // เราจึงต้องลบ 7 ชั่วโมงกลับเพื่อให้เป็นค่า UTC ที่ถูกต้อง
    // จากนั้น Frontend (ซึ่งอยู่ในโซน UTC+7) จะบวก 7 ชั่วโมงกลับมาแสดงผลได้ถูกต้อง
    return new Date(utcDate.getTime() - (7 * 60 * 60 * 1000));
};

const getAccountingHistory = async (filters) => {
  const { 
    page = 1, 
    pageSize = 15, 
    searchTerm, 
    organizationId,
    startDate, 
    endDate,
    sortBy = 'acctstarttime',
    sortOrder = 'desc'
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const whereClause = {};

  if (startDate) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate); 
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    whereClause.acctstarttime = { gte: start, lte: end };
  }
  
  if (organizationId) {
    const usersInOrg = await prisma.user.findMany({
      where: { organizationId: parseInt(organizationId) },
      select: { username: true },
    });
    const usernamesInOrg = usersInOrg.map(u => u.username);
    if (usernamesInOrg.length > 0) {
      whereClause.username = { in: usernamesInOrg };
    } else {
      return { history: [], totalRecords: 0, totalPages: 0, currentPage: parseInt(page) };
    }
  }

  if (searchTerm) {
    const userSearch = await prisma.user.findMany({
        where: { full_name: { contains: searchTerm } },
        select: { username: true }
    });
    const usernamesFromSearch = userSearch.map(u => u.username);

    whereClause.OR = [
      { username: { contains: searchTerm } },
      { framedipaddress: { contains: searchTerm } },
      { callingstationid: { contains: searchTerm } },
    ];

    if (usernamesFromSearch.length > 0) {
        whereClause.OR.push({ username: { in: usernamesFromSearch } });
    }
  }

  let orderBy = {};
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'logintime':
        orderBy = { acctstarttime: order };
        break;
    case 'logouttime':
        orderBy = { acctstoptime: order };
        break;
    case 'duration':
        orderBy = { acctsessiontime: order };
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
  
  const [history, totalRecords] = await prisma.$transaction([
    prisma.radacct.findMany({
      where: whereClause,
      skip,
      take,
      orderBy,
    }),
    prisma.radacct.count({ where: whereClause }),
  ]);
  
  const usernames = history.map(rec => rec.username);
  const usersData = await prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { username: true, full_name: true }
  });
  const userMap = new Map(usersData.map(u => [u.username, u.full_name]));

  let combinedData = history.map(rec => ({
    ...rec,
    radacctid: rec.radacctid.toString(),
    acctinputoctets: rec.acctinputoctets ? rec.acctinputoctets.toString() : '0',
    acctoutputoctets: rec.acctoutputoctets ? rec.acctoutputoctets.toString() : '0',
    full_name: userMap.get(rec.username) || 'N/A',
    acctstarttime: adjustToLocalTime(rec.acctstarttime),
    acctstoptime: adjustToLocalTime(rec.acctstoptime),
    acctupdatetime: adjustToLocalTime(rec.acctupdatetime)
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
    history: combinedData,
    totalRecords,
    totalPages: Math.ceil(totalRecords / pageSize),
    currentPage: parseInt(page),
  };
};

module.exports = {
  getAccountingHistory,
};