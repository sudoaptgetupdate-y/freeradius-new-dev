// src/controllers/externalAuthController.js
const externalAuthService = require('../services/externalAuthService');

const login = async (req, res, next) => {
    try {
        // รับค่าทั้งหมดที่ service คืนมา ซึ่งตอนนี้มี token แล้ว
        const { token, user, advertisement } = await externalAuthService.loginUser(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            // ส่งข้อมูลทั้งหมดกลับไปใน data object
            data: { token, user, advertisement },
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

module.exports = {
    login,
};