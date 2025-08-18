// src/services/advertisementService.js
const prisma = require('../prisma');

const getAllAdvertisements = async () => {
  return prisma.advertisement.findMany({
    orderBy: { name: 'asc' },
  });
};

const createAdvertisement = async (adData) => {
  // Prisma จะแปลงค่าว่างให้เป็น null โดยอัตโนมัติ
  return prisma.advertisement.create({
    data: adData,
  });
};

const updateAdvertisement = async (id, adData) => {
  return prisma.advertisement.update({
    where: { id: parseInt(id) },
    data: adData,
  });
};

const deleteAdvertisement = async (id) => {
  const advertisementId = parseInt(id);

  // ตรวจสอบว่ามี Organization ใดใช้งานโฆษณานี้อยู่หรือไม่
  const organizationsUsingAd = await prisma.organization.count({
    where: { advertisementId: advertisementId },
  });

  // ถ้ามี ให้โยน Error เพื่อป้องกันการลบ
  if (organizationsUsingAd > 0) {
    throw new Error(
      `Cannot delete advertisement. It is currently in use by ${organizationsUsingAd} organization(s). Please unassign it first.`
    );
  }

  // ถ้าไม่มี จึงทำการลบ
  return prisma.advertisement.delete({
    where: { id: advertisementId },
  });
};

module.exports = {
  getAllAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
};