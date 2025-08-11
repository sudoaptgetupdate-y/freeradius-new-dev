// src/controllers/onlineUsersController.js
const onlineUserService = require('../services/onlineUserService');
const kickService = require('../services/kickService');

const listOnlineUsers = async (req, res, next) => {
  try {
    const result = await onlineUserService.getOnlineUsers(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const kickUser = async (req, res, next) => {
  try {
    const sessionData = req.body;
    const result = await kickService.kickUserSession(sessionData);
    res.status(200).json({ success: true, message: `Kick command sent for user ${sessionData.username}.`, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const clearStale = async (req, res, next) => {
  try {
    const result = await onlineUserService.clearStaleSessions();
    res.status(200).json({ success: true, message: `${result.clearedCount} stale session(s) cleared.`, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOnlineUsers,
  kickUser,
  clearStale,
};