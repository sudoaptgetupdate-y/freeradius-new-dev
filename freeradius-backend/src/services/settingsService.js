// src/services/settingsService.js
const prisma = require('../prisma');
const fs = require('fs');
const path = require('path');

const upsertSetting = async (key, value) => {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
};

const getSettings = async () => {
  const settings = await prisma.setting.findMany();
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
  return settingsMap;
};

// --- START: แก้ไขฟังก์ชันนี้ ---
const saveSettings = async (files, body) => {
  const { terms } = body;

  // ฟังก์ชันช่วยสำหรับลบไฟล์เก่า
  const deleteOldFile = async (settingKey) => {
    try {
      const oldSetting = await prisma.setting.findUnique({ where: { key: settingKey } });
      if (oldSetting && oldSetting.value) {
        // สร้าง path เต็มไปยังไฟล์เก่า
        const oldFilePath = path.join(__dirname, '../../public', oldSetting.value);
        // ตรวจสอบว่าไฟล์มีอยู่จริงก่อนลบ
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old file: ${oldFilePath}`);
        }
      }
    } catch (error) {
      console.error(`Could not delete old file for key ${settingKey}:`, error);
      // ไม่ต้อง throw error เพื่อให้การอัปโหลดไฟล์ใหม่ดำเนินต่อไปได้
    }
  };

  // 1. จัดการไฟล์ Logo
  if (files && files.logo) {
    await deleteOldFile('logoUrl'); // <-- ลบไฟล์โลโก้เก่า
    const logoFile = files.logo[0];
    const logoPath = `/uploads/${logoFile.filename}`;
    await upsertSetting('logoUrl', logoPath);
  }

  // 2. จัดการไฟล์ Background
  if (files && files.background) {
    await deleteOldFile('backgroundUrl'); // <-- ลบไฟล์พื้นหลังเก่า
    const bgFile = files.background[0];
    const bgPath = `/uploads/${bgFile.filename}`;
    await upsertSetting('backgroundUrl', bgPath);
  }

  // 3. จัดการข้อความ Terms of Service
  if (terms !== undefined) { // <-- ตรวจสอบเพื่อให้สามารถส่งค่าว่างได้
    await upsertSetting('terms', terms);
  }

  return { message: 'Settings saved successfully' };
};
// --- END ---

module.exports = {
  getSettings,
  saveSettings,
};