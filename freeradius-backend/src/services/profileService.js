// src/services/profileService.js
const prisma = require('../prisma');

const getAllProfiles = async () => {
  return prisma.RadiusProfile.findMany({ 
    orderBy: { name: 'asc' } 
  });
};

const createProfile = async (data) => {
  const { name, description } = data; // รับค่า description จาก data ที่ส่งมา
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

// --- START: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---
const deleteProfile = async (id) => {
  const profileId = parseInt(id);

  // 1. ตรวจสอบว่ามี Organization ใดใช้ Profile นี้อยู่หรือไม่
  const organizationsUsingProfile = await prisma.organization.findMany({
    where: { radiusProfileId: profileId },
    select: { name: true }, // ดึงมาแค่ชื่อก็พอ
  });

  // 2. ถ้ามี ให้โยน Error พร้อมบอกชื่อองค์กร
  if (organizationsUsingProfile.length > 0) {
    const orgNames = organizationsUsingProfile.map(org => org.name).join(', ');
    throw new Error(`Cannot delete profile. It is currently in use by: ${orgNames}`);
  }

  // 3. ถ้าไม่มี จึงทำการลบ
  return prisma.RadiusProfile.delete({
    where: { id: profileId },
  });
};
// --- END: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---

module.exports = {
  getAllProfiles,
  createProfile,
  getProfileById,
  deleteProfile, // <-- Export ฟังก์ชันใหม่
};