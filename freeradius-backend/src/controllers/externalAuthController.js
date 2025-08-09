// src/controllers/externalAuthController.js
const externalAuthService = require('../services/externalAuthService');

const login = async (req, res, next) => {
    try {
        const { user, advertisement } = await externalAuthService.loginUser(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: { user, advertisement },
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

module.exports = {
    login,
};