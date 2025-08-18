// src/controllers/statusController.js
const statusService = require('../services/statusService');

const getStatus = async (req, res, next) => {
  try {
    const status = await statusService.getFreeradiusStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

const restartService = async (req, res, next) => {
  try {
    await statusService.restartFreeradiusService();
    res.status(200).json({ success: true, message: 'FreeRADIUS service is restarting.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  restartService,
};