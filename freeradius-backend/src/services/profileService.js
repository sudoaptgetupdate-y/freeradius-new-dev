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

// --- START: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---
const updateProfile = async (id, data) => {
  const { name, description } = data;
  const profileId = parseInt(id);

  const existingProfile = await prisma.RadiusProfile.findUnique({
    where: { id: profileId },
  });

  if (!existingProfile) {
    throw new Error('Profile not found.');
  }

  // หากมีการเปลี่ยนชื่อ Profile ต้องอัปเดต groupname ในตารางที่เกี่ยวข้องด้วย
  if (name && name !== existingProfile.name) {
    await prisma.$transaction([
      prisma.radGroupCheck.updateMany({
        where: { groupname: existingProfile.name },
        data: { groupname: name },
      }),
      prisma.radGroupReply.updateMany({
        where: { groupname: existingProfile.name },
        data: { groupname: name },
      }),
      prisma.RadiusProfile.update({
        where: { id: profileId },
        data: { name, description },
      }),
    ]);
  } else {
    // หากเปลี่ยนแค่ description ให้อัปเดตเฉพาะ Profile
    await prisma.RadiusProfile.update({
      where: { id: profileId },
      data: { description },
    });
  }

  return prisma.RadiusProfile.findUnique({ where: { id: profileId } });
};
// --- END: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---

const deleteProfile = async (id) => {
  const profileId = parseInt(id);

  const profileToDelete = await prisma.RadiusProfile.findUnique({
    where: { id: profileId },
  });

  if (!profileToDelete) {
    throw new Error('Profile not found.');
  }

  const organizationsUsingProfile = await prisma.organization.findMany({
    where: { radiusProfileId: profileId },
    select: { name: true },
  });

  if (organizationsUsingProfile.length > 0) {
    const orgNames = organizationsUsingProfile.map(org => org.name).join(', ');
    throw new Error(`Cannot delete profile. It is currently in use by: ${orgNames}`);
  }

  return prisma.$transaction(async (tx) => {
    const profileName = profileToDelete.name;

    await tx.radGroupReply.deleteMany({
      where: { groupname: profileName },
    });
    
    await tx.radGroupCheck.deleteMany({
      where: { groupname: profileName },
    });

    await tx.radiusProfile.delete({
      where: { id: profileId },
    });
  });
};

module.exports = {
  getAllProfiles,
  createProfile,
  getProfileById,
  updateProfile, // <-- Export ฟังก์ชันใหม่
  deleteProfile,
};