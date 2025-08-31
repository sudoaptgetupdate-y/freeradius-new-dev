// src/services/organizationService.js
const prisma = require('../prisma');

const createOrganization = async (orgData) => {
  // --- START: ส่วนที่แก้ไข ---
  const { name, login_identifier_type, radiusProfileId, advertisementId } = orgData;
  // --- END ---

  if (!radiusProfileId) {
    throw new Error('A Radius Profile must be selected.');
  }

  // --- START: ส่วนที่แก้ไข ---
  const dataToCreate = {
    name,
    login_identifier_type: login_identifier_type || 'manual',
    radiusProfileId: parseInt(radiusProfileId),
  };

  if (advertisementId) {
    dataToCreate.advertisementId = parseInt(advertisementId);
  }
  // --- END ---

  return prisma.organization.create({
    data: dataToCreate,
  });
};

const getAllOrganizations = async (filters = {}) => {
  const { searchTerm, page = 1, pageSize = 10 } = filters;
  const whereClause = {};

  if (searchTerm) {
    whereClause.name = {
      contains: searchTerm,
    };
  }
  
  // --- START: แก้ไขส่วนนี้ ---
  const isPagingDisabled = parseInt(pageSize, 10) === -1;

  const skip = isPagingDisabled ? 0 : (parseInt(page) - 1) * parseInt(pageSize);
  const take = isPagingDisabled ? undefined : parseInt(pageSize);
  // --- END ---

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
          },
          advertisementId: true, 
          advertisement: {      
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
    totalPages: isPagingDisabled ? 1 : Math.ceil(totalOrgs / take),
    currentPage: isPagingDisabled ? 1 : parseInt(page),
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
    if (updateData.name && updateData.name !== existingOrg.name) {
      throw new Error(`The name of the "${existingOrg.name}" organization cannot be changed.`);
    }
    if (updateData.login_identifier_type && updateData.login_identifier_type !== 'manual') {
      throw new Error(`The Login Identifier Type for the "${existingOrg.name}" organization must always be 'manual'.`);
    }
  }

  const dataToUpdate = { ...updateData };

  if (dataToUpdate.radiusProfileId) {
    dataToUpdate.radiusProfileId = parseInt(dataToUpdate.radiusProfileId, 10);
  }

  if (dataToUpdate.advertisementId === '' || dataToUpdate.advertisementId === 'null' || dataToUpdate.advertisementId === null) {
    dataToUpdate.advertisementId = null;
  } else if (dataToUpdate.advertisementId) {
    dataToUpdate.advertisementId = parseInt(dataToUpdate.advertisementId, 10);
  }
  
  return prisma.organization.update({
    where: { id: organizationId },
    data: dataToUpdate,
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