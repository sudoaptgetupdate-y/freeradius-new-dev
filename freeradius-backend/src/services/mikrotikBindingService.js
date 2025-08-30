const RouterOSAPi = require('node-routeros');
const prisma = require('../prisma');
const { decrypt } = require('../utils/crypto');

// Helper function to create a connection
const connectToMikrotik = async () => {
    const config = await prisma.mikrotikDevice.findFirst();
    if (!config) {
        throw new Error('Mikrotik API settings are not configured.');
    }
    
    const decryptedPassword = decrypt(config.password);
    if (!decryptedPassword) {
        throw new Error('Failed to decrypt Mikrotik password. Check encryption key.');
    }

    const conn = new RouterOSAPi({
        host: config.host,
        user: config.user,
        password: decryptedPassword,
        keepalive: true
    });
    await conn.connect();
    return conn;
};

const getIpBindings = async () => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const results = await conn.write('/ip/hotspot/ip-binding/print');
        await conn.close();
        return results;
    } catch (error) {
        if (conn) await conn.close();
        console.error("Mikrotik API Error (getIpBindings):", error);
        throw new Error(error.message || 'Failed to fetch IP bindings from Mikrotik.');
    }
};

const addIpBinding = async (data) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const command = ['/ip/hotspot/ip-binding/add', `=mac-address=${data.macAddress}`];
        if (data.address) command.push(`=address=${data.address}`);
        if (data.toAddress) command.push(`=to-address=${data.toAddress}`);
        if (data.comment) command.push(`=comment=${data.comment}`);
        command.push(`=type=${data.type}`);
        
        await conn.write(command);
        await conn.close();
        return { success: true };
    } catch (error) {
        if (conn) await conn.close();
        console.error("Mikrotik API Error (addIpBinding):", error);
        throw new Error(error.message || 'Failed to add IP binding.');
    }
};

const removeIpBinding = async (id) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        // Mikrotik IDs often start with '*', so we need to include it.
        await conn.write('/ip/hotspot/ip-binding/remove', [`=.id=${id}`]);
        await conn.close();
        return { success: true };
    } catch (error) {
        if (conn) await conn.close();
        console.error("Mikrotik API Error (removeIpBinding):", error);
        throw new Error(error.message || 'Failed to remove IP binding.');
    }
};


module.exports = {
    getIpBindings,
    addIpBinding,
    removeIpBinding,
};