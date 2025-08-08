// src/controllers/externalAuthController.js
const externalAuthService = require('../services/externalAuthService');

const login = async (req, res, next) => {
    try {
        const user = await externalAuthService.loginUser(req.body);
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: user,
        });
    } catch (error) {
        // ส่งข้อความ Error ที่ Service สร้างขึ้นกลับไปให้ Frontend
        res.status(401).json({ success: false, message: error.message });
    }
};

module.exports = {
    login,
};