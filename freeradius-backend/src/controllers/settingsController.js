// src/controllers/settingsController.js
const settingsService = require('../services/settingsService');

const getAppSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateAppSettings = async (req, res, next) => {
  try {
    // req.files มาจาก multer, req.body มาจากฟอร์ม
    const result = await settingsService.saveSettings(req.files, req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppSettings,
  updateAppSettings,
};