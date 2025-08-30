// freeradius-backend/src/services/mikrotikApiService.js
const RouterOSAPi = require('node-routeros');
const prisma = require('../prisma');
const { encrypt } = require('../utils/crypto');

const getApiConfig = async () => {
    // For simplicity, we assume only one Mikrotik device is configured.
    return prisma.mikrotikDevice.findFirst();
};

const saveApiConfig = async (configData) => {
    const { host, user, password } = configData;
    if (!host || !user || !password) {
        throw new Error('Host, user, and password are required.');
    }

    const encryptedPassword = encrypt(password);

    const existingConfig = await prisma.mikrotikDevice.findFirst();
    if (existingConfig) {
        return prisma.mikrotikDevice.update({
            where: { id: existingConfig.id },
            data: { host, user, password: encryptedPassword },
        });
    } else {
        return prisma.mikrotikDevice.create({
            data: { host, user, password: encryptedPassword },
        });
    }
};

const testApiConnection = async (configData) => {
    const { host, user, password } = configData;
    if (!host || !user || !password) {
        throw new Error('Host, user, and password are required for testing.');
    }

    let conn;
    try {
        conn = new RouterOSAPi({
            host,
            user,
            password,
            keepalive: false, // Don't keep connection open for a simple test
            timeout: 5 // Timeout in seconds
        });
        await conn.connect();
        // Run a simple command to verify the connection is working
        await conn.write('/system/resource/print');
        await conn.close();
        return { success: true, message: 'Connection successful!' };
    } catch (error) {
        if (conn) await conn.close();
        // Provide a more user-friendly error message
        if (error.code === 'ENOTFOUND') {
            throw new Error(`Connection failed: Host '${host}' not found.`);
        } else if (error.message.includes('Authentication failed')) {
            throw new Error('Connection failed: Invalid username or password.');
        }
        throw new Error(`Connection failed: ${error.message}`);
    }
};

module.exports = {
    getApiConfig,
    saveApiConfig,
    testApiConnection,
};