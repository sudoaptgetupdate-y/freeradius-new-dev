const { RouterOSAPI } = require('routeros-api');
const prisma = require('../prisma');
const { encrypt } = require('../utils/crypto');

// --- START: **DEBUG LOG ขั้นสูงสุด** ---
console.log('--- Loading mikrotikApiService.js ---');
console.log('--- Checking All Environment Variables available to this process ---');
// บรรทัดด้านล่างนี้จะแสดง Environment Variables ทั้งหมดที่โปรแกรมเห็นตอนเริ่มทำงาน
// ให้มองหา IP Address ที่น่าสงสัยใน Log ที่แสดงผลออกมาครับ
console.log(process.env);
console.log('--- Finished checking Environment Variables ---');
// --- END: **DEBUG LOG ขั้นสูงสุด** ---


const getApiConfig = async () => {
    // ... โค้ดส่วนนี้เหมือนเดิม
    return prisma.mikrotikDevice.findFirst();
};

const saveApiConfig = async (configData) => {
    // ... โค้ดส่วนนี้เหมือนเดิม
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
    // --- START: **DEBUG LOG ขั้นสูงสุด** ---
    console.log('--- [SERVICE] testApiConnection function START ---');
    console.log('Full configData object received by service:', configData);
    // --- END: **DEBUG LOG ขั้นสูงสุด** ---

    const { host, user, password, useTls } = configData;

    console.log(`--- [Step 1] Initializing API connection to ${host} ---`);
    const conn = new RouterOSAPI({ 
        host, 
        user, 
        password, 
        tls: !!useTls, 
        timeout: 3
    });

    try {
        await conn.connect();
        console.log(`--- [Step 2] Connection to ${host} established. Verifying API... ---`);
        const data = await conn.write('/system/resource/print');
        console.log('--- [Step 3] API Verification successful. ---');
        console.log('Mikrotik response:', data[0]);
        return { success: true, message: 'Connection successful!' };
    } catch (error) {
        console.error('Mikrotik Connection Error:', error);
        let errorMessage = `Connection failed: ${error.message || 'An unknown error occurred.'}`;
        if (error.code === 'ETIMEDOUT' || (error.message && error.message.toLowerCase().includes('timeout'))) {
            errorMessage = `Connection failed: Timed out while trying to connect to '${host}'.`;
        } else if (error.errno === 'ENOTFOUND' || error.code === 'ENOTFOUND') {
            errorMessage = `Connection failed: Host '${host}' not found.`;
        } else if (error.message && (error.message.toLowerCase().includes('authentication failed') || error.message.toLowerCase().includes('invalid user name or password'))) {
            errorMessage = 'Connection failed: Username or password is invalid.';
        }
        throw new Error(errorMessage);
    } finally {
        if (conn.connected) {
            console.log('--- [Step 4] Closing connection. ---');
            conn.close();
        }
    }
};

module.exports = {
    getApiConfig,
    saveApiConfig,
    testApiConnection,
};