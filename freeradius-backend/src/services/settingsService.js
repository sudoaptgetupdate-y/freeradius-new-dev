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
    voucherSsid,
    voucherHeaderText,
    voucherFooterText,
    registrationEnabled,
    externalLoginEnabled 
  } = body;

  const deleteOldFile = async (settingKey) => {
    const oldSetting = await prisma.setting.findUnique({ where: { key: settingKey } });
    if (oldSetting && oldSetting.value) {
      const oldFilePath = path.join(__dirname, '../../public', oldSetting.value);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
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

  if (files && files.voucherLogo) {
    await deleteOldFile('voucherLogoUrl');
    const voucherLogoFile = files.voucherLogo[0];
    const voucherLogoPath = `/uploads/${voucherLogoFile.filename}`;
    await upsertSetting('voucherLogoUrl', voucherLogoPath);
  }

  if (terms !== undefined) {
    await upsertSetting('terms', terms);
  }

  if (registrationEnabled !== undefined) {
    await upsertSetting('registrationEnabled', registrationEnabled);
  }
  
  if (externalLoginEnabled !== undefined) {
    await upsertSetting('externalLoginEnabled', externalLoginEnabled);
  }

  if (voucherSsid !== undefined) await upsertSetting('voucherSsid', voucherSsid);
  if (voucherHeaderText !== undefined) await upsertSetting('voucherHeaderText', voucherHeaderText);
  if (voucherFooterText !== undefined) await upsertSetting('voucherFooterText', voucherFooterText);

  return { message: 'Settings saved successfully' };
};

module.exports = {
  getSettings,
  saveSettings,
};