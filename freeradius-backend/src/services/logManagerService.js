// src/services/logManagerService.js
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const prisma = require('../prisma');

const IS_PROD = os.platform() === 'linux';
const LOG_DIR = IS_PROD ? '/var/log/devices' : 'D:/fake_logs/devices';

const RSYSLOG_CONFIG_FILE = '/etc/rsyslog.d/50-devices.conf';
const MANAGE_SCRIPT_PATH = '/usr/local/bin/manage-device-logs.sh';
const FAILSAFE_SCRIPT_PATH = '/usr/local/bin/clear-oldest-logs-failsafe.sh';

// --- Mock Data Functions ---
const getMockDashboardData = () => ({
    diskUsage: { size: '50G', used: '25G', available: '25G', usePercent: '50%' },
    gpgKey: { recipient: 'local-dev-admin@example.com' },
    top5LargestLogDays: [
        { host: 'firewall-01', name: '2025-08-18.log.gz.gpg', size: 19123456789 },
        { host: 'switch-core', name: '2025-08-19.log.gz.gpg', size: 18456789123 },
        { host: 'firewall-01', name: '2025-08-19.log.gz.gpg', size: 17234567890 },
        { host: 'server-db-01', name: '2025-08-17.log.gz.gpg', size: 15234567890 },
        { host: 'wifi-controller', name: '2025-08-18.log.gz.gpg', size: 14234567890 },
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
    gpgKey: { recipient: 'local-dev-admin@example.com' }
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
    } else { // month & year for simplicity
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
    console.log(`SIMULATING command on non-linux OS: "${command}"`);
    if (command.startsWith('df')) return Promise.resolve('Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/sda1 51475068 25956316 23379896 53% /');
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

// --- Main Service Functions ---
const getDashboardData = async () => {
    if (!IS_PROD) return getMockDashboardData();
    
    const dfOutput = await executeCommand(`df -h ${LOG_DIR}`);
    const lines = dfOutput.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const [, size, used, available, usePercent] = lastLine.split(/\s+/);
    
    const gpgRecipient = await readVarFromScript(MANAGE_SCRIPT_PATH, 'GPG_RECIPIENT');

    const allIndividualFiles = [];
    try {
        const hosts = await fs.readdir(LOG_DIR);
        for (const host of hosts) {
            const hostPath = path.join(LOG_DIR, host);
            if ((await fs.stat(hostPath)).isDirectory()) {
                const filesInHost = await fs.readdir(hostPath);
                for (const file of filesInHost) {
                    if (file.endsWith('.log.gz.gpg')) {
                        const filePath = path.join(hostPath, file);
                        const fileStat = await fs.stat(filePath);
                        allIndividualFiles.push({
                            host,
                            name: file,
                            size: fileStat.size,
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error reading log files for dashboard:", error);
    }
    
    const top5LargestLogDays = allIndividualFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);

    return {
        diskUsage: { size, used, available, usePercent },
        gpgKey: { recipient: gpgRecipient },
        top5LargestLogDays,
    };
};

const getLogFiles = async (filters = {}) => {
    if (!IS_PROD) return getMockLogFiles(filters);
    const { page = 1, pageSize = 15, startDate, endDate } = filters;
    let allFiles = [];
    try {
        const hosts = await fs.readdir(LOG_DIR);
        for (const host of hosts) {
            const hostPath = path.join(LOG_DIR, host);
            try {
                if ((await fs.stat(hostPath)).isDirectory()) {
                    const filesInHost = await fs.readdir(hostPath);
                    for (const file of filesInHost) {
                        if (file.endsWith('.log.gz.gpg')) {
                            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
                            if (!dateMatch) continue;
                            const fileDate = new Date(dateMatch[1]);
                            if (startDate && fileDate < new Date(new Date(startDate).setHours(0,0,0,0))) continue;
                            if (endDate && fileDate > new Date(new Date(endDate).setHours(23,59,59,999))) continue;
                            const filePath = path.join(hostPath, file);
                            const fileStat = await fs.stat(filePath);
                            allFiles.push({ id: Buffer.from(filePath).toString('base64'), path: filePath, host, name: file, size: fileStat.size, modified: fileStat.mtime });
                        }
                    }
                }
            } catch (error) {
                console.error(`Could not process directory entries for ${hostPath}:`, error);
            }
        }
    } catch (error) {
        console.error(`Could not read LOG_DIR ${LOG_DIR}:`, error);
    }
    allFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    const totalRecords = allFiles.length;
    const totalPages = Math.ceil(totalRecords / parseInt(pageSize));
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedFiles = allFiles.slice(skip, skip + parseInt(pageSize));
    return { files: paginatedFiles, totalRecords, totalPages, currentPage: parseInt(page) };
};

const recordDownloadEvent = async (adminId, fileName, ipAddress) => {
    try {
        if (!adminId) {
            console.error('[Audit Log Error] Admin ID is missing.');
            return;
        }
        await prisma.logDownloadHistory.create({ data: { fileName, ipAddress, adminId } });
        console.log(`[Audit Log Success] Recorded download for Admin ID: ${adminId}`);
    } catch (error) {
        console.error('--- [Audit Log Error] Failed to record log download event ---');
        console.error('Timestamp:', new Date().toISOString(), { adminId, fileName, ipAddress });
        console.error('Prisma Error:', error);
        console.error('--- End of Audit Log Error ---');
    }
};

const getSystemConfig = async () => {
    if (!IS_PROD) return getMockSystemConfig();
    try {
        const rsyslogContent = await fs.readFile(RSYSLOG_CONFIG_FILE, 'utf-8');
        const deviceIPs = (rsyslogContent.match(/\$fromhost-ip == '(\S+)'/g) || []).map(line => line.match(/'(\S+)'/)[1]);
        const retentionDays = await readVarFromScript(MANAGE_SCRIPT_PATH, 'RETENTION_DAYS');
        const criticalThreshold = await readVarFromScript(FAILSAFE_SCRIPT_PATH, 'CRITICAL_THRESHOLD');
        const targetThreshold = await readVarFromScript(FAILSAFE_SCRIPT_PATH, 'TARGET_THRESHOLD');
        const gpgRecipient = await readVarFromScript(MANAGE_SCRIPT_PATH, 'GPG_RECIPIENT');
        return { deviceIPs, retentionDays, failsafe: { critical: criticalThreshold, target: targetThreshold }, gpgKey: { recipient: gpgRecipient } };
    } catch (error) {
        console.error('Failed to read system configuration:', error);
        throw new Error('Could not retrieve system configuration. Please ensure log manager is installed.');
    }
};

const getDownloadHistory = async (filters = {}) => {
    const { page = 1, pageSize = 15, adminId, startDate, endDate } = filters;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);
    const whereClause = {};
    if (adminId) whereClause.adminId = parseInt(adminId);
    if (startDate) whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(new Date(startDate).setHours(0,0,0,0)) };
    if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(new Date(endDate).setHours(23,59,59,999)) };
    const [history, totalRecords] = await prisma.$transaction([
        prisma.logDownloadHistory.findMany({ where: whereClause, orderBy: { createdAt: 'desc' }, include: { admin: { select: { fullName: true, username: true } } }, skip, take }),
        prisma.logDownloadHistory.count({ where: whereClause }),
    ]);
    return { history, totalRecords, totalPages: Math.ceil(totalRecords / take), currentPage: parseInt(page) };
};

const getLogVolumeGraphData = async (period = 'day') => {
    if (!IS_PROD) {
        return getMockLogVolumeGraphData(period);
    }
    
    let allFiles = [];
    try {
        const hosts = await fs.readdir(LOG_DIR);
        for (const host of hosts) {
            const hostPath = path.join(LOG_DIR, host);
            if ((await fs.stat(hostPath)).isDirectory()) {
                const filesInHost = await fs.readdir(hostPath);
                for (const file of filesInHost) {
                    if (file.endsWith('.log.gz.gpg')) {
                        const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
                        if (dateMatch) {
                            const filePath = path.join(hostPath, file);
                            const fileStat = await fs.stat(filePath);
                            allFiles.push({ host, date: dateMatch[1], size: fileStat.size });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error reading log files for graph:", error);
        return { chartData: [], hosts: [] };
    }

    const aggregated = allFiles.reduce((acc, { host, date, size }) => {
        let key;
        const d = new Date(date);
        switch (period) {
            case 'week':
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                break;
            case 'year':
                key = `${d.getFullYear()}-01-01`;
                break;
            default:
                key = date;
        }
        if (!acc[key]) acc[key] = {};
        acc[key][host] = (acc[key][host] || 0) + size;
        return acc;
    }, {});
    
    const allHosts = [...new Set(allFiles.map(f => f.host))];
    const chartData = Object.entries(aggregated).map(([date, hostData]) => {
        const entry = { date };
        allHosts.forEach(host => {
            entry[host] = hostData[host] || 0;
        });
        return entry;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    return { chartData, hosts: allHosts };
};

// Helper to replace a variable value in a script file
const replaceVarInFile = async (filePath, varName, newValue) => {
    if (!newValue) return; // Don't update if value is empty
    const originalContent = await fs.readFile(filePath, 'utf-8');
    const regex = new RegExp(`(^${varName}=).*`, 'm');
    const newContent = originalContent.replace(regex, `$1"${newValue}"`);
    await fs.writeFile(filePath, newContent, 'utf-8');
};

const updateSystemConfig = async (config) => {
    if (!IS_PROD) {
        console.log("--- SIMULATING CONFIGURATION UPDATE ---");
        console.log("Received new config:", JSON.stringify(config, null, 2));
        console.log(`SIMULATED: Writing to ${RSYSLOG_CONFIG_FILE}`);
        console.log(`SIMULATED: Writing to ${MANAGE_SCRIPT_PATH}`);
        console.log(`SIMULATED: Writing to ${FAILSAFE_SCRIPT_PATH}`);
        if (config.deviceIPsChanged) { // สมมติว่า Frontend ส่ง flag นี้มา
            console.log("SIMULATED COMMAND: sudo /bin/systemctl restart rsyslog");
        }
        console.log("--- SIMULATION END ---");
        return { message: "Configuration update simulated successfully." };
    }

    // Production Logic
    // 1. Update rsyslog config for device IPs
    if (config.deviceIPs) {
        const newRsyslogContent = config.deviceIPs
            .map(ip => `if $fromhost-ip == '${ip}' then /var/log/devices/%HOSTNAME%/${new Date().toISOString().slice(0, 10)}.log`)
            .join('\n');
        await fs.writeFile(RSYSLOG_CONFIG_FILE, newRsyslogContent, 'utf-8');
    }

    // 2. Update manage-device-logs.sh
    await replaceVarInFile(MANAGE_SCRIPT_PATH, 'RETENTION_DAYS', config.retentionDays);
    
    // 3. Update clear-oldest-logs-failsafe.sh
    if (config.failsafe) {
        await replaceVarInFile(FAILSAFE_SCRIPT_PATH, 'CRITICAL_THRESHOLD', config.failsafe.critical);
        await replaceVarInFile(FAILSAFE_SCRIPT_PATH, 'TARGET_THRESHOLD', config.failsafe.target);
    }
    
    // 4. Restart rsyslog if IPs changed (assuming a flag is passed from frontend)
    if (config.deviceIPsChanged) {
        await executeCommand('sudo /bin/systemctl restart rsyslog');
    }

    return { message: "Configuration updated successfully." };
};

module.exports = {
    getDashboardData,
    getLogFiles,
    getSystemConfig,
    recordDownloadEvent,
    getDownloadHistory,
    getLogVolumeGraphData,
    updateSystemConfig,
    LOG_DIR,
};