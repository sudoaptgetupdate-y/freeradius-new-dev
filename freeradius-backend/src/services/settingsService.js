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

const saveSettings = async (files, body) => {
  const { 
    terms,
    // --- START: รับค่าใหม่สำหรับ Voucher ---
    voucherSsid,
    voucherHeaderText,
    voucherFooterText
    // --- END ---
  } = body;

  const deleteOldFile = async (settingKey) => {
    // ... (ฟังก์ชันนี้คงเดิม)
  };

  if (files && files.logo) {
    await deleteOldFile('logoUrl');
    const logoFile = files.logo[0];
    const logoPath = `/uploads/${logoFile.filename}`;
    await upsertSetting('logoUrl', logoPath);
  }

  if (files && files.background) {
    await deleteOldFile('backgroundUrl');
    const bgFile = files.background[0];
    const bgPath = `/uploads/${bgFile.filename}`;
    await upsertSetting('backgroundUrl', bgPath);
  }

  if (terms !== undefined) {
    await upsertSetting('terms', terms);
  }

  // --- START: เพิ่ม Logic การบันทึกค่า Voucher ---
  if (files && files.voucherLogo) {
    await deleteOldFile('voucherLogoUrl'); // ลบโลโก้บัตรเก่า
    const voucherLogoFile = files.voucherLogo[0];
    const voucherLogoPath = `/uploads/${voucherLogoFile.filename}`;
    await upsertSetting('voucherLogoUrl', voucherLogoPath);
  }

  if (voucherSsid !== undefined) await upsertSetting('voucherSsid', voucherSsid);
  if (voucherHeaderText !== undefined) await upsertSetting('voucherHeaderText', voucherHeaderText);
  if (voucherFooterText !== undefined) await upsertSetting('voucherFooterText', voucherFooterText);
  // --- END ---

  return { message: 'Settings saved successfully' };
};


module.exports = {
  getSettings,
  saveSettings,
};