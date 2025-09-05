// freeradius-backend/src/services/mikrotikApiService.js
const { RouterOSAPI } = require('routeros-api');
const prisma = require('../prisma');
// --- START: แก้ไขบรรทัดนี้ ---
const { encrypt, decrypt } = require('../utils/crypto'); 
// --- END ---

const getApiConfig = async () => {
    return prisma.mikrotikDevice.findFirst();
};

const saveApiConfig = async (configData) => {
    const { host, user, password, useTls } = configData;
    // Password is not required if just updating host, user, or useTls
    if (password) {
        const encryptedPassword = encrypt(password);
        const existingConfig = await prisma.mikrotikDevice.findFirst();
        if (existingConfig) {
            return prisma.mikrotikDevice.update({
                where: { id: existingConfig.id },
                data: { host, user, password: encryptedPassword, useTls: !!useTls },
            });
        } else {
            if (!host || !user) throw new Error('Host and user are required for initial setup.');
            return prisma.mikrotikDevice.create({
                data: { host, user, password: encryptedPassword, useTls: !!useTls },
            });
        }
    } else {
        const existingConfig = await prisma.mikrotikDevice.findFirst();
        if (!existingConfig) {
            throw new Error("Password is required for the initial setup.");
        }
        return prisma.mikrotikDevice.update({
            where: { id: existingConfig.id },
            data: { host, user, useTls: !!useTls },
        });
    }
};


const testApiConnection = async (configData) => {
    let { host, user, password, useTls } = configData;

    // ถ้าไม่ได้ส่งรหัสผ่านมาด้วย ให้ไปดึงจากฐานข้อมูล
    if (!password) {
        const savedConfig = await prisma.mikrotikDevice.findFirst();
        if (!savedConfig) {
            throw new Error('API settings not found. Please save settings first.');
        }
        password = decrypt(savedConfig.password);
        if (!password) {
            throw new Error('Failed to decrypt saved password.');
        }
        // ใช้ข้อมูลที่บันทึกไว้เป็นหลัก
        host = savedConfig.host;
        user = savedConfig.user;
        useTls = savedConfig.useTls;
    }

    if (!host || !user) {
        throw new Error('Host and user are required for testing.');
    }

    const conn = new RouterOSAPI({
        host,
        user,
        password,
        tls: !!useTls,
        timeout: 3,
        charset: 'utf8'
    });

    try {
        await conn.connect();
        await conn.write('/system/resource/print');
        return { success: true, message: 'Connection successful!' };

    } catch (error) {
        console.error('Mikrotik Connection Test Failed:', error);
        
        let errorMessage = `Connection failed: ${error.message || 'An unknown error occurred.'}`;
        if (error.code === 'ETIMEDOUT' || (error.message && error.message.toLowerCase().includes('timeout'))) {
            errorMessage = `Connection failed: Timed out while trying to connect to '${host}'. Please check the IP address and firewall.`;
        } else if (error.errno === 'ENOTFOUND' || error.code === 'ENOTFOUND') {
            errorMessage = `Connection failed: Host '${host}' not found or unreachable.`;
        } else if (error.message && (error.message.toLowerCase().includes('authentication failed') || error.message.toLowerCase().includes('invalid user name or password'))) {
            errorMessage = 'Connection failed: Username or password is invalid.';
        }
        
        throw new Error(errorMessage);

    } finally {
        if (conn.connected) {
            conn.close();
        }
    }
};

const getMikrotikStatus = async () => {
    const config = await prisma.mikrotikDevice.findFirst();
    if (!config) {
        return { status: 'offline', reason: 'Not configured' };
    }

    const password = decrypt(config.password);
    if (!password) {
        return { status: 'offline', reason: 'Password decryption failed' };
    }

    const conn = new RouterOSAPI({
        host: config.host,
        user: config.user,
        password,
        tls: config.useTls,
        timeout: 2,
    });

    try {
        await conn.connect();
        return { status: 'online' };
    } catch (error) {
        return { status: 'offline', reason: error.message };
    } finally {
        if (conn.connected) {
            conn.close();
        }
    }
};


module.exports = {
    getApiConfig,
    saveApiConfig,
    testApiConnection,
    getMikrotikStatus,
};