// src/services/profileService.js
const prisma = require('../prisma');

const getAllProfiles = async () => {
  return prisma.RadiusProfile.findMany({ 
    orderBy: { name: 'asc' } 
  });
};

const createProfile = async (data) => {
  const { name, description } = data;
  return prisma.RadiusProfile.create({ 
    data: { 
      name, 
      description 
    } 
  });
};

const getProfileById = async (id) => {
  const profile = await prisma.RadiusProfile.findUnique({
    where: { id: parseInt(id) },
    include: {
      replyAttributes: true,
      checkAttributes: true,
    },
  });
  if (!profile) {
    throw new Error('Profile not found');
  }
  return profile;
};

const deleteProfile = async (id) => {
  const profileId = parseInt(id);

  const profileToDelete = await prisma.RadiusProfile.findUnique({
    where: { id: profileId },
  });

  if (!profileToDelete) {
    throw new Error('Profile not found.');
  }

  // 1. ตรวจสอบว่ามี Organization ใดใช้ Profile นี้อยู่หรือไม่
  const organizationsUsingProfile = await prisma.organization.findMany({
    where: { radiusProfileId: profileId },
    select: { name: true },
  });

  if (organizationsUsingProfile.length > 0) {
    const orgNames = organizationsUsingProfile.map(org => org.name).join(', ');
    throw new Error(`Cannot delete profile. It is currently in use by: ${orgNames}`);
  }

  // 2. ถ้าไม่มี Organization ผูกอยู่ ให้ทำการลบข้อมูลใน Transaction
  return prisma.$transaction(async (tx) => {
    const profileName = profileToDelete.name;

    // 2.1 ลบ Attributes ที่เกี่ยวข้องใน radgroupreply
    // ใช้ tx.radGroupReply เพราะชื่อโมเดลใน schema.prisma คือ RadGroupReply
    await tx.radGroupReply.deleteMany({
      where: { groupname: profileName },
    });
    
    // 2.2 ลบ Attributes ที่เกี่ยวข้องใน radgroupcheck
    // ใช้ tx.radGroupCheck เพราะชื่อโมเดลใน schema.prisma คือ RadGroupCheck
    await tx.radGroupCheck.deleteMany({
      where: { groupname: profileName },
    });

    // 2.3 ลบ Profile หลัก
    // ใช้ tx.radiusProfile เพราะชื่อโมเดลใน schema.prisma คือ RadiusProfile
    await tx.radiusProfile.delete({
      where: { id: profileId },
    });
  });
};

module.exports = {
  getAllProfiles,
  createProfile,
  getProfileById,
  deleteProfile,
};