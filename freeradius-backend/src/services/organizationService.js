// src/services/organizationService.js
const prisma = require('../prisma');

const createOrganization = async (orgData) => {
  // --- แก้ไข: รับ radiusProfileId เข้ามาด้วย ---
  const { name, login_identifier_type, radiusProfileId } = orgData;

  if (!radiusProfileId) {
    throw new Error('A Radius Profile must be selected.');
  }

  return prisma.organization.create({
    data: {
      name,
      login_identifier_type: login_identifier_type || 'manual',
      radiusProfileId: parseInt(radiusProfileId), // <-- เพิ่มข้อมูลนี้
    },
  });
};

const getAllOrganizations = async (filters = {}) => {
  const { searchTerm, page = 1, pageSize = 10 } = filters;
  const whereClause = {};

  if (searchTerm) {
    whereClause.name = {
      contains: searchTerm,
      mode: 'insensitive', // Optional: ทำให้ค้นหาแบบ case-insensitive
    };
  }
  
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const [organizations, totalOrgs] = await prisma.$transaction([
    prisma.organization.findMany({
      where: whereClause,
      select: {
          id: true,
          name: true,
          login_identifier_type: true,
          radiusProfileId: true,
          radiusProfile: {
              select: {
                  name: true
              }
          }
      },
      orderBy: { name: 'asc' },
      skip: skip,
      take: take,
    }),
    prisma.organization.count({ where: whereClause }),
  ]);
  
  return {
    organizations,
    totalOrgs,
    totalPages: Math.ceil(totalOrgs / take),
    currentPage: parseInt(page),
  };
};

const getOrganizationById = async (orgId) => {
  const organization = await prisma.organization.findUnique({
    where: { id: parseInt(orgId, 10) },
  });
  if (!organization) {
    throw new Error('Organization not found');
  }
  return organization;
};

const updateOrganization = async (orgId, updateData) => {
  // --- แก้ไข: รับ radiusProfileId เข้ามาด้วย ---
  const { name, login_identifier_type, radiusProfileId } = updateData;
  return prisma.organization.update({
    where: { id: parseInt(orgId, 10) },
    data: {
      name,
      login_identifier_type,
      radiusProfileId: parseInt(radiusProfileId), // <-- เพิ่มข้อมูลนี้
    },
  });
};

// --- START: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---
const deleteOrganization = async (orgId) => {
  const organizationId = parseInt(orgId, 10);

  // 1. ตรวจสอบว่ามี User สังกัดองค์กรนี้หรือไม่
  const userCount = await prisma.user.count({
    where: { organizationId: organizationId },
  });

  // 2. ถ้ามี ให้โยน Error
  if (userCount > 0) {
    throw new Error(`Cannot delete organization. There are ${userCount} user(s) associated with it.`);
  }

  // 3. ถ้าไม่มี จึงทำการลบ
  return prisma.organization.delete({
    where: { id: organizationId },
  });
};
// --- END: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization, // <-- Export ฟังก์ชันใหม่
};