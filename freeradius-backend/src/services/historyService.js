// src/services/historyService.js
const prisma = require('../prisma');

const getAccountingHistory = async (filters) => {
  const { 
    page = 1, 
    pageSize = 15, 
    searchTerm, 
    organizationId,
    startDate, 
    endDate,
    sortBy = 'acctstarttime', // Default sort
    sortOrder = 'desc'       // Default order
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const whereClause = {};

  // --- Date Filter Logic (ของเดิม) ---
  if (startDate) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate); 
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    whereClause.acctstarttime = { gte: start, lte: end };
  }
  
  // --- Organization Filter Logic (ของใหม่) ---
  let usersInOrg = [];
  if (organizationId) {
    usersInOrg = await prisma.user.findMany({
      where: { organizationId: parseInt(organizationId) },
      select: { username: true },
    });
    const usernamesInOrg = usersInOrg.map(u => u.username);
    if (usernamesInOrg.length > 0) {
      whereClause.username = { in: usernamesInOrg };
    } else {
      // ถ้าไม่พบ user ในองค์กร ก็ไม่ต้องแสดงผลลัพธ์
      return { history: [], totalRecords: 0, totalPages: 0, currentPage: parseInt(page) };
    }
  }

  // --- Search Term Logic (ปรับปรุงใหม่) ---
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

  // --- Sorting Logic (ของใหม่) ---
  const orderBy = {};
  if (sortBy === 'totaldata') {
    // การเรียงลำดับสำหรับ Total Data จะทำในโค้ดหลังจากดึงข้อมูล
  } else if (['acctstarttime', 'acctstoptime', 'acctinputoctets', 'acctoutputoctets'].includes(sortBy)) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy['acctstarttime'] = 'desc'; // Fallback
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
  
  // --- Data Enrichment (ของใหม่) ---
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
    full_name: userMap.get(rec.username) || 'N/A'
  }));

  // --- Post-query sorting for Total Data ---
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