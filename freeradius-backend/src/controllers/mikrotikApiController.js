const mikrotikApiService = require('../services/mikrotikApiService');

const getConfig = async (req, res, next) => {
    try {
        const config = await mikrotikApiService.getApiConfig();
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
        // ไม่ว่า client จะส่ง password มาหรือไม่, service จะจัดการเอง
        const result = await mikrotikApiService.testApiConnection(req.body);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getConnectionStatus = async (req, res, next) => {
    try {
        const result = await mikrotikApiService.getMikrotikStatus();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getConfig,
    saveConfig,
    testConnection,
    getConnectionStatus, // <-- Export ฟังก์ชันใหม่
};