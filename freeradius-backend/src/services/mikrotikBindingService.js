// freeradius-backend/src/services/mikrotikBindingService.js
const { RouterOSAPI } = require('routeros-api');
const prisma = require('../prisma');
const { decrypt } = require('../utils/crypto');
const { encodeToMikrotikHex, decodeFromMikrotikHex } = require('../utils/mikrotikUtils');

const connectToMikrotik = async () => {
    const config = await prisma.mikrotikDevice.findFirst();
    if (!config) throw new Error('Mikrotik API settings are not configured.');
    const decryptedPassword = decrypt(config.password);
    if (!decryptedPassword) throw new Error('Failed to decrypt Mikrotik password. Check encryption key.');
    const conn = new RouterOSAPI({
        host: config.host,
        user: config.user,
        password: decryptedPassword,
        tls: config.useTls || false,
        charset: 'utf8'
    });
    await conn.connect();
    return conn;
};

const getIpBindings = async (filters = {}) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const results = await conn.write(['/ip/hotspot/ip-binding/print']);
        const decodedResults = results.map(binding => ({
            ...binding,
            comment: decodeFromMikrotikHex(binding.comment)
        }));
        
        const { searchTerm, type } = filters;
        let filteredResults = decodedResults;
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredResults = decodedResults.filter(item =>
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(lowercasedFilter)
                )
            );
        }
        if (type) {
            filteredResults = filteredResults.filter(item => item.type === type);
        }
        return filteredResults;
    } catch (error) {
        console.error("Mikrotik API Error (getIpBindings):", error);
        throw new Error('Failed to fetch IP bindings from Mikrotik.');
    } finally {
        if (conn && conn.connected) await conn.close();
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
        if (data.comment) command.push(`=comment=${encodeToMikrotikHex(data.comment)}`);
        
        await conn.write(command);
        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (addIpBinding):", error);
        throw new Error(`Failed to add IP binding: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};


// --- START: MODIFIED SECTION (REPLACE STRATEGY) ---
const updateIpBinding = async (id, data) => {
    let conn;
    try {
        conn = await connectToMikrotik();

        // Step 1: Remove the existing binding using its .id.
        // This is the most reliable way to ensure old values are cleared.
        await conn.write('/ip/hotspot/ip-binding/remove', [`=.id=${id}`]);

        // Step 2: Add a new binding with the updated information.
        // This re-uses the same logic as the 'addIpBinding' function.
        const addCommand = [
            '/ip/hotspot/ip-binding/add',
            `=mac-address=${data.macAddress}`,
            `=type=${data.type}`,
        ];
        if (data.address) {
            addCommand.push(`=address=${data.address}`);
        }
        if (data.toAddress) {
            addCommand.push(`=to-address=${data.toAddress}`);
        }
        if (data.comment) {
            addCommand.push(`=comment=${encodeToMikrotikHex(data.comment)}`);
        }
        
        await conn.write(addCommand);
        return { success: true };

    } catch (error) {
        console.error("Mikrotik API Error (updateIpBinding with Replace Strategy):", error);
        throw new Error(`Failed to update IP binding: ${error.message}`);
    } finally {
        if (conn && conn.connected) {
            await conn.close();
        }
    }
};
// --- END: MODIFIED SECTION ---

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
        if (conn && conn.connected) await conn.close();
    }
};

module.exports = {
    getIpBindings,
    addIpBinding,
    updateIpBinding,
    removeIpBinding,
};