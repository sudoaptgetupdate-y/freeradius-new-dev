const { RouterOSAPI, RosException } = require('routeros-api'); // <-- **แก้ไข**
const prisma = require('../prisma');
const { decrypt } = require('../utils/crypto');

const connectToMikrotik = async () => {
    const config = await prisma.mikrotikDevice.findFirst();
    if (!config) {
        throw new Error('Mikrotik API settings are not configured.');
    }
    const decryptedPassword = decrypt(config.password);
    if (!decryptedPassword) {
        throw new Error('Failed to decrypt Mikrotik password. Check encryption key.');
    }

    const conn = new RouterOSAPI({ // <-- **แก้ไข**
        host: config.host,
        user: config.user,
        password: decryptedPassword,
        tls: false
    });

    await conn.connect();
    return conn; 
};

const getIpBindings = async () => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const results = await conn.write('/ip/hotspot/ip-binding/print');
        return results;
    } catch (error) {
        console.error("Mikrotik API Error (getIpBindings):", error);
        throw new Error('Failed to fetch IP bindings from Mikrotik.');
    } finally {
        if (conn && conn.connected) {
            conn.close();
        }
    }
};

const addIpBinding = async (data) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const command = [
            '/ip/hotspot/ip-binding/add',
            `=mac-address=${data.macAddress}`,
            `=type=${data.type}`,
        ];
        if (data.address) command.push(`=address=${data.address}`);
        if (data.toAddress) command.push(`=to-address=${data.toAddress}`);
        if (data.comment) command.push(`=comment=${data.comment}`);
        
        await conn.write(command);
        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (addIpBinding):", error);
        throw new Error('Failed to add IP binding.');
    } finally {
        if (conn && conn.connected) {
            conn.close();
        }
    }
};

const removeIpBinding = async (id) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        await conn.write('/ip/hotspot/ip-binding/remove', [`=.id=${id}`]);
        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (removeIpBinding):", error);
        throw new Error('Failed to remove IP binding.');
    } finally {
        if (conn && conn.connected) {
            conn.close();
        }
    }
};

module.exports = {
    getIpBindings,
    addIpBinding,
    removeIpBinding,
};