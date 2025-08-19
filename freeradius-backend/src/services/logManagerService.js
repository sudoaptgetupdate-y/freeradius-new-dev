// src/services/logManagerService.js
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const prisma = require('../prisma');

const IS_PROD = os.platform() === 'linux';
const LOG_DIR = IS_PROD ? '/var/log/devices' : 'D:/fake_logs/devices';

const RSYSLOG_CONFIG_FILE = IS_PROD ? '/etc/rsyslog.d/50-devices.conf' : 'D:/fake_logs/50-devices.conf';
const MANAGE_SCRIPT_PATH = IS_PROD ? '/usr/local/bin/manage-device-logs.sh' : 'D:/fake_logs/manage-device-logs.sh';
const FAILSAFE_SCRIPT_PATH = IS_PROD ? '/usr/local/bin/clear-oldest-logs-failsafe.sh' : 'D:/fake_logs/clear-oldest-logs-failsafe.sh';

// --- Mock Data Functions (ครบถ้วน) ---
const getMockDashboardData = () => ({
    diskUsage: { size: '50G', used: '25G', available: '25G', usePercent: '50%' },
    gpgKey: { recipient: 'local-dev-admin@example.com' },
    top5LargestLogDays: [
        { host: 'firewall-01', name: '2025-08-18.log.gz.gpg', size: 19123456789 },
        { host: 'switch-core', name: '2025-08-19.log.gz.gpg', size: 18456789123 },
        { host: 'firewall-01', name: '2025-08-19.log.gz.gpg', size: 17234567890 },
    ],
});
const getMockLogFiles = (filters = {}) => {
    const { page = 1, pageSize = 15, startDate, endDate } = filters;
    let files = [];
    const hosts = ['firewall-01', 'switch-core', 'router-branch-A', 'server-db-01'];
    for (const host of hosts) {
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const fileName = `${dateStr}.log.gz.gpg`;
            const filePath = path.join(LOG_DIR, host, fileName);
            files.push({
                id: Buffer.from(filePath).toString('base64'),
                path: filePath, host, name: fileName,
                size: Math.floor(Math.random() * 1e9) + 5e8,
                modified: date,
            });
        }
    }
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        files = files.filter(f => new Date(f.modified) >= start);
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        files = files.filter(f => new Date(f.modified) <= end);
    }
    files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    const totalRecords = files.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const skip = (page - 1) * pageSize;
    const paginatedFiles = files.slice(skip, skip + parseInt(pageSize));
    return { files: paginatedFiles, totalRecords, totalPages, currentPage: parseInt(page) };
};
const getMockSystemConfig = () => ({
    deviceIPs: ['192.168.1.1', '10.0.0.1'],
    retentionDays: '90',
    failsafe: { critical: '95', target: '90' },
});
const getMockLogVolumeGraphData = (period) => {
    const hosts = ['firewall-01', 'switch-core'];
    let chartData = [];
    if (period === 'day') {
        chartData = [
            { date: '2025-08-17', 'firewall-01': 8e9, 'switch-core': 6e9 },
            { date: '2025-08-18', 'firewall-01': 9e9, 'switch-core': 7e9 },
            { date: '2025-08-19', 'firewall-01': 7.5e9, 'switch-core': 8e9 },
        ];
    } else if (period === 'week') {
        chartData = [
            { date: '2025-08-11', 'firewall-01': 45e9, 'switch-core': 40e9 },
            { date: '2025-08-18', 'firewall-01': 50e9, 'switch-core': 42e9 },
        ];
    } else {
         chartData = [
            { date: '2025-07-01', 'firewall-01': 180e9, 'switch-core': 160e9 },
            { date: '2025-08-01', 'firewall-01': 200e9, 'switch-core': 170e9 },
        ];
    }
    return { chartData, hosts };
};

// --- Helper Functions ---
const executeCommand = (command) => {
  if (!IS_PROD) {
    console.log(`SIMULATING command: "${command}"`);
    return Promise.resolve('');
  }
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error for command "${command}": ${stderr}`);
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout);
    });
  });
};
const readVarFromScript = async (filePath, varName) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const match = content.match(new RegExp(`^${varName}=(\\S+)`, 'm'));
        return match ? match[1].replace(/"/g, '') : null;
    } catch (error) {
        if (IS_PROD) console.error(`Could not read ${varName} from ${filePath}:`, error.message);
        return null;
    }
};
const replaceVarInFile = async (filePath, varName, newValue) => {
    const originalContent = await fs.readFile(filePath, 'utf-8');
    const regex = new RegExp(`(^${varName}=).*`, 'm');
    let newContent;
    if (originalContent.match(regex)) {
        newContent = originalContent.replace(regex, `$1"${newValue}"`);
    } else {
        newContent = `${originalContent.trim()}\n${varName}="${newValue}"\n`;
    }
    await fs.writeFile(filePath, newContent, 'utf-8');
};

// --- Main Service Functions ---
const getDashboardData = async () => { /* ... */ };
const getLogFiles = async (filters = {}) => { /* ... */ };
const recordDownloadEvent = async (adminId, fileName, ipAddress) => { /* ... */ };
const getSystemConfig = async () => { /* ... */ };
const getDownloadHistory = async (filters = {}) => { /* ... */ };
const getLogVolumeGraphData = async (period = 'day') => { /* ... */ };
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
        const templateString = `template(name="DeviceLog" type="string" string="${LOG_DIR}/%HOSTNAME%/%$YEAR%-%$MONTH%-%$DAY%.log")`;
        const rulesString = config.deviceIPs
            .map(ip => `if $fromhost-ip == '${ip}' then {\n    action(type="omfile" dynaFile="DeviceLog")\n    stop\n}`)
            .join('\n');
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
const updateLogSettings = async (config) => {
     if (!IS_PROD) {
        console.log("SIMULATING: Updating Log Settings:", config);
        return { message: "Log settings update simulated successfully." };
    }
    try {
        console.log(`[Config Update] Updating Retention & Failsafe settings...`);
        await replaceVarInFile(MANAGE_SCRIPT_PATH, 'RETENTION_DAYS', config.retentionDays);
        if (config.failsafe) {
            await replaceVarInFile(FAILSAFE_SCRIPT_PATH, 'CRITICAL_THRESHOLD', config.failsafe.critical);
            await replaceVarInFile(FAILSAFE_SCRIPT_PATH, 'TARGET_THRESHOLD', config.failsafe.target);
        }
        console.log('[Config Update] Successfully updated Retention & Failsafe settings.');
        return { message: "Log settings updated successfully." };
    } catch (error) {
        console.error('[CONFIG UPDATE FAILED - Settings]', error);
        throw new Error(`Settings update failed: ${error.message}`);
    }
};

module.exports = {
    getDashboardData,
    getLogFiles,
    getSystemConfig,
    recordDownloadEvent,
    getDownloadHistory,
    getLogVolumeGraphData,
    updateDeviceIps,
    updateLogSettings,
    LOG_DIR,
};
