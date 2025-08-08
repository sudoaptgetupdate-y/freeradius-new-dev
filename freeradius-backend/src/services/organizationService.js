// src/services/organizationService.js
const prisma = require('../prisma');

const createOrganization = async (orgData) => {
  const { name, login_identifier_type, radiusProfileId } = orgData;

  if (!radiusProfileId) {
    throw new Error('A Radius Profile must be selected.');
  }

  return prisma.organization.create({
    data: {
      name,
      login_identifier_type: login_identifier_type || 'manual',
      radiusProfileId: parseInt(radiusProfileId),
    },
  });
};

const getAllOrganizations = async (filters = {}) => {
  const { searchTerm, page = 1, pageSize = 10 } = filters;
  const whereClause = {};

  if (searchTerm) {
    whereClause.name = {
      contains: searchTerm,
      mode: 'insensitive',
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
  const { name, login_identifier_type, radiusProfileId } = updateData;
  return prisma.organization.update({
    where: { id: parseInt(orgId, 10) },
    data: {
      name,
      login_identifier_type,
      radiusProfileId: parseInt(radiusProfileId),
    },
  });
};

// --- START: แก้ไขฟังก์ชันนี้ ---
const deleteOrganization = async (orgId) => {
  const organizationId = parseInt(orgId, 10);

  // 1. ค้นหาองค์กรที่จะลบ
  const organizationToDelete = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organizationToDelete) {
    throw new Error('Organization not found.');
  }

  //ตรวจสอบชื่อองค์กร ถ้าเป็น "Register" หรือ "Voucher" ให้โยน Error ทันที
  if (organizationToDelete.name === 'Register' || organizationToDelete.name === 'Voucher') {
    throw new Error(`The "${organizationToDelete.name}" organization is critical for the system and cannot be deleted.`);
  }

  // 3. ตรวจสอบว่ามี User สังกัดองค์กรนี้หรือไม่ (Logic เดิม)
  const userCount = await prisma.user.count({
    where: { organizationId: organizationId },
  });

  if (userCount > 0) {
    throw new Error(`Cannot delete organization. There are ${userCount} user(s) associated with it.`);
  }

  // 4. ถ้าไม่มี จึงทำการลบ (Logic เดิม)
  return prisma.organization.delete({
    where: { id: organizationId },
  });
};
// --- END: สิ้นสุดการแก้ไข ---

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
};