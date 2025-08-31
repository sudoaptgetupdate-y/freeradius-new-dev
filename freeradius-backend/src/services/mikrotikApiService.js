// freeradius-backend/src/services/mikrotikApiService.js
const { RouterOSAPI } = require('routeros-api');
const prisma = require('../prisma');
const { encrypt } = require('../utils/crypto');

const getApiConfig = async () => {
    return prisma.mikrotikDevice.findFirst();
};

const saveApiConfig = async (configData) => {
    const { host, user, password, useTls } = configData;
    if (!host || !user || !password) {
        throw new Error('Host, user, and password are required.');
    }
    const encryptedPassword = encrypt(password);
    const existingConfig = await prisma.mikrotikDevice.findFirst();
    if (existingConfig) {
        return prisma.mikrotikDevice.update({
            where: { id: existingConfig.id },
            data: { host, user, password: encryptedPassword, useTls: !!useTls },
        });
    } else {
        return prisma.mikrotikDevice.create({
            data: { host, user, password: encryptedPassword, useTls: !!useTls },
        });
    }
};

const testApiConnection = async (configData) => {
    const { host, user, password, useTls } = configData;

    if (!host || !user || !password) {
        throw new Error('Host, user, and password are required for testing.');
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

module.exports = {
    getApiConfig,
    saveApiConfig,
    testApiConnection,
};