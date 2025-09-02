// freeradius-backend/src/services/mikrotikHotspotService.js
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

const getHotspotActiveHosts = async (filters = {}) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const hosts = await conn.write('/ip/hotspot/active/print');
        
        const decodedHosts = hosts.map(host => ({
            ...host,
            comment: decodeFromMikrotikHex(host.comment)
        }));

        const { searchTerm } = filters;
        if (!searchTerm) {
            return decodedHosts;
        }

        const lowercasedFilter = searchTerm.toLowerCase();
        return decodedHosts.filter(host =>
            Object.values(host).some(val =>
                String(val).toLowerCase().includes(lowercasedFilter)
            )
        );

    } catch (error) {
        console.error("Mikrotik API Error (getHotspotActiveHosts):", error);
        throw new Error('Failed to fetch active hosts from Mikrotik.');
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};

const removeHotspotActiveHosts = async (hostIds) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const commands = hostIds.map(id => ['/ip/hotspot/active/remove', `=.id=${id}`]);
        // Although routeros-api doesn't support batch commands in one write,
        // we execute them sequentially. It's acceptable for this use case.
        for (const command of commands) {
            await conn.write(command[0], command.slice(1));
        }
        return { success: true, removedCount: hostIds.length };
    } catch (error) {
        console.error("Mikrotik API Error (removeHotspotActiveHosts):", error);
        throw new Error(`Failed to remove active hosts: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};


const makeBindingForHosts = async (hostsData, bindingType) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        let createdCount = 0;
        
        for (const host of hostsData) {
            const command = [
                '/ip/hotspot/ip-binding/add',
                `=mac-address=${host['mac-address']}`,
                `=address=${host.address}`,
                `=server=${host.server || 'all'}`, // Use 'all' as a fallback if server is not present
                `=type=${bindingType}`,
                `=comment=${encodeToMikrotikHex(host.user || `Bound on ${new Date().toLocaleDateString()}`)}`,
            ];
            await conn.write(command);
            createdCount++;
        }
        return { success: true, createdCount };
    } catch (error) {
        console.error("Mikrotik API Error (makeBindingForHosts):", error);
        throw new Error(`Failed to create IP bindings: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};

module.exports = {
    getHotspotActiveHosts,
    removeHotspotActiveHosts,
    makeBindingForHosts,
};