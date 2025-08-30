// freeradius-backend/src/controllers/mikrotikApiController.js
const mikrotikApiService = require('../services/mikrotikApiService');

const getConfig = async (req, res, next) => {
    try {
        const config = await mikrotikApiService.getApiConfig();
        // Do not send the password back to the client
        if (config) {
            const { password, ...safeConfig } = config;
            res.status(200).json({ success: true, data: safeConfig });
        } else {
            res.status(200).json({ success: true, data: null });
        }
    } catch (error) {
        next(error);
    }
};

const saveConfig = async (req, res, next) => {
    try {
        const savedConfig = await mikrotikApiService.saveApiConfig(req.body);
        const { password, ...safeConfig } = savedConfig;
        res.status(200).json({ success: true, message: 'Mikrotik API settings saved successfully.', data: safeConfig });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const testConnection = async (req, res, next) => {
    try {
        console.log('--- [CONTROLLER] Request received at /test-connection ---');
        console.log('Request Body (req.body):', req.body);
        const result = await mikrotikApiService.testApiConnection(req.body);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        // Send a 400 Bad Request status for connection errors
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getConfig,
    saveConfig,
    testConnection,
};