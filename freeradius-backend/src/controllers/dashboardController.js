// src/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');

const getDashboardStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getOnlineUsersGraphData = async (req, res, next) => {
    try {
        const { period } = req.query;
        const data = await dashboardService.getOnlineUsersGraph(period);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  getDashboardStats,
  getOnlineUsersGraphData,
};