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

const updateDeviceIps = async (config) => {
    if (!IS_PROD) {
        console.log("SIMULATING: Updating Device IPs:", config.deviceIPs);
        if (config.deviceIPsChanged) {
             console.log("SIMULATED COMMAND: sudo /bin/systemctl restart rsyslog");
        }
        return { message: "Device IPs update simulated successfully." };
    }
    try {
        console.log(`[Config Update] Writing ${config.deviceIPs.length} IPs to ${RSYSLOG_CONFIG_FILE}`);
        
        // 1. สร้าง "แม่แบบ" (Template) ขึ้นมาก่อนที่บรรทัดบนสุด
        const templateString = `template(name="DeviceLog" type="string" string="${LOG_DIR}/%HOSTNAME%/%$YEAR%-%$MONTH%-%$DAY%.log")`;
        
        // 2. สร้าง "กฎ" (Rule) สำหรับแต่ละ IP โดยให้อ้างอิงไปใช้แม่แบบ
        const rulesString = config.deviceIPs
            .map(ip => `if $fromhost-ip == '${ip}' then {
    action(type="omfile" dynaFile="DeviceLog")
    stop
}`)
            .join('\n');
        
        // 3. รวมทุกอย่างเข้าด้วยกัน แล้วเขียนลงไฟล์
        const newRsyslogContent = `${templateString}\n\n${rulesString}\n`;
        await fs.writeFile(RSYSLOG_CONFIG_FILE, newRsyslogContent, 'utf-8');
        console.log('[Config Update] Successfully wrote to rsyslog config.');

        if (config.deviceIPsChanged) {
            console.log('[Config Update] IP list changed. Attempting to restart rsyslog service...');
            await executeCommand('sudo /bin/systemctl restart rsyslog');
            console.log('[Config Update] rsyslog service restarted successfully.');
        }
        return { message: "Device IPs updated successfully." };
    } catch (error) {
        console.error('[CONFIG UPDATE FAILED - IPs]', error);
        throw new Error(`IPs update failed: ${error.message}`);
    }
};

const updateLogSettings = async (req, res, next) => {
    try {
        const result = await logManagerService.updateLogSettings(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
    updateDeviceIps,
    updateLogSettings,
};