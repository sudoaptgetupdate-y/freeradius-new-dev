// src/controllers/logManagerController.js
const logManagerService = require('../services/logManagerService');
const path = require('path');
const fs = require('fs'); 

const getDashboardData = async (req, res, next) => {
    try {
        const data = await logManagerService.getDashboardData();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const getLogFiles = async (req, res, next) => {
    try {
        const filesData = await logManagerService.getLogFiles(req.query);
        res.status(200).json({ success: true, data: filesData });
    } catch (error) {
        next(error);
    }
};

const downloadLogFile = async (req, res, next) => {
    try {
        const filePath = Buffer.from(req.query.id, 'base64').toString('ascii');
        
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(path.normalize(logManagerService.LOG_DIR))) {
            return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
        }

        if (!fs.existsSync(normalizedPath)) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }

        const fileName = path.basename(filePath);

        const adminId = req.admin.id;
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logManagerService.recordDownloadEvent(adminId, fileName, ipAddress);

        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        const fileStream = fs.createReadStream(normalizedPath);
        fileStream.pipe(res);

    } catch (error) {
        next(error);
    }
};

const getSystemConfig = async (req, res, next) => {
    try {
        const config = await logManagerService.getSystemConfig();
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

const getDownloadHistory = async (req, res, next) => {
    try {
        const historyData = await logManagerService.getDownloadHistory(req.query);
        res.status(200).json({ success: true, data: historyData });
    } catch (error) {
        next(error);
    }
};

const getLogVolumeGraph = async (req, res, next) => {
    try {
        const { period } = req.query;
        const data = await logManagerService.getLogVolumeGraphData(period);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardData,
    getLogFiles,
    downloadLogFile,
    getSystemConfig,
    getDownloadHistory,
    getLogVolumeGraph,
};