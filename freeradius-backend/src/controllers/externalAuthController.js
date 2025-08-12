// src/controllers/externalAuthController.js
const externalAuthService = require('../services/externalAuthService');

const login = async (req, res, next) => {
    try {
        const result = await externalAuthService.loginUser(req.body);
        
        if (result.action === 'redirect') {
            // กรณี Captive Portal: ส่ง action และ URL กลับไปให้ Frontend
            res.status(200).json({
                action: 'redirect',
                redirectUrl: result.redirectUrl,
            });
        } else {
            // กรณี Firewall Authentication (เหมือนเดิม)
            res.status(200).json({
                success: true,
                message: 'Login successful!',
                data: result.data,
            });
        }
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

module.exports = {
    login,
};