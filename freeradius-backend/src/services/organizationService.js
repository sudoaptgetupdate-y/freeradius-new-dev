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
  const organizationId = parseInt(orgId, 10);

  const existingOrg = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!existingOrg) {
    throw new Error('Organization not found.');
  }

  const isProtectedOrg = existingOrg.name === 'Register' || existingOrg.name === 'Voucher';
  
  if (isProtectedOrg) {
    // 1. ป้องกันการเปลี่ยนชื่อ
    if (updateData.name && updateData.name !== existingOrg.name) {
      throw new Error(`The name of the "${existingOrg.name}" organization cannot be changed.`);
    }

    // 2. ป้องกันการเปลี่ยน Login Identifier Type
    if (updateData.login_identifier_type && updateData.login_identifier_type !== 'manual') {
      throw new Error(`The Login Identifier Type for the "${existingOrg.name}" organization must always be 'manual'.`);
    }
  }
  
  // แปลง radiusProfileId เป็น Int ก่อนบันทึก (ถ้ามี)
  if (updateData.radiusProfileId) {
    updateData.radiusProfileId = parseInt(updateData.radiusProfileId, 10);
  }

  return prisma.organization.update({
    where: { id: organizationId },
    data: updateData,
  });
};

const deleteOrganization = async (orgId) => {
  const organizationId = parseInt(orgId, 10);

  const organizationToDelete = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organizationToDelete) {
    throw new Error('Organization not found.');
  }

  if (organizationToDelete.name === 'Register' || organizationToDelete.name === 'Voucher') {
    throw new Error(`The "${organizationToDelete.name}" organization is critical for the system and cannot be deleted.`);
  }

  const userCount = await prisma.user.count({
    where: { organizationId: organizationId },
  });

  if (userCount > 0) {
    throw new Error(`Cannot delete organization. There are ${userCount} user(s) associated with it.`);
  }

  return prisma.organization.delete({
    where: { id: organizationId },
  });
};

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
};