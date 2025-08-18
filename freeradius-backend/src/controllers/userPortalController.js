// src/controllers/userPortalController.js
const userPortalService = require('../services/userPortalService');

// 👇 เพิ่มโค้ดส่วนนี้เข้าไป
const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await userPortalService.login(username, password);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        // ส่งต่อไปให้ errorHandler จัดการ
        next(error);
    }
};
// 👆 สิ้นสุดส่วนที่ต้องเพิ่ม

const getProfile = async (req, res, next) => {
    try {
        const userProfile = await userPortalService.getMyProfile(req.user.id);
        res.status(200).json({ success: true, data: userProfile });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const updatedUser = await userPortalService.updateMyProfile(req.user.id, req.body);
        res.status(200).json({ success: true, message: "Profile updated successfully.", data: updatedUser });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        // req.user.id มาจาก middleware protectUser
        await userPortalService.changeMyPassword(req.user.id, oldPassword, newPassword);
        res.status(200).json({ success: true, message: "Password changed successfully." });
    } catch (error) {
        // ส่งต่อ error ไปให้ errorHandler จัดการ (ซึ่งจะส่ง status 400 กลับไปถ้ามีปัญหา)
        next(error);
    }
};

const clearSessions = async (req, res, next) => {
    try {
        const result = await userPortalService.clearMySessions(req.user.username);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginUser,
    getProfile,
    updateProfile,
    changePassword,
    clearSessions,
};