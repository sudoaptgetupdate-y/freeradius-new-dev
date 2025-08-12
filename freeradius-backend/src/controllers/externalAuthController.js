// src/controllers/externalAuthController.js
const externalAuthService = require('../services/externalAuthService');

const login = async (req, res, next) => {
    try {
        const result = await externalAuthService.loginUser(req.body);

        // --- START: เพิ่มเงื่อนไขการตอบกลับ ---
        if (result.action === 'redirect') {
            // ถ้า Service บอกให้ redirect ก็ส่ง redirect กลับไป
            res.status(200).json(result);
        } else {
            // ถ้าไม่ ก็ส่ง JSON ปกติ
            res.status(200).json({
                success: true,
                message: 'Login successful!',
                data: result.data,
            });
        }
        // --- END ---
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

module.exports = {
    login,
};