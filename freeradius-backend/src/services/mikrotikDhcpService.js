// freeradius-backend/src/services/mikrotikDhcpService.js
const { RouterOSAPI } = require('routeros-api');
const prisma = require('../prisma');
const { decrypt } = require('../utils/crypto');
// --- START: เพิ่มการ import encodeToMikrotikHex ---
const { decodeFromMikrotikHex, encodeToMikrotikHex } = require('../utils/mikrotikUtils');
// --- END ---

const connectToMikrotik = async () => {
    const config = await prisma.mikrotikDevice.findFirst();
    if (!config) throw new Error('Mikrotik API settings are not configured.');

    const decryptedPassword = decrypt(config.password);
    if (!decryptedPassword) {
        throw new Error('Failed to decrypt Mikrotik password. Check encryption key.');
    }

    const conn = new RouterOSAPI({
        host: config.host,
        user: config.user,
        password: decryptedPassword,
        tls: config.useTls || false,
        timeout: 5,
        charset: 'utf8'
    });

    await conn.connect();
    return conn;
};

const getDhcpLeases = async (filters = {}) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const leases = await conn.write('/ip/dhcp-server/lease/print');

        const decodedLeases = leases.map(lease => ({
            ...lease,
            comment: decodeFromMikrotikHex(lease.comment)
        }));

        const { searchTerm } = filters;
        if (!searchTerm) {
            return decodedLeases;
        }

        const lowercasedFilter = searchTerm.toLowerCase();
        return decodedLeases.filter(lease =>
            Object.values(lease).some(val =>
                String(val).toLowerCase().includes(lowercasedFilter)
            )
        );
    } catch (error) {
        console.error("Mikrotik API Error (getDhcpLeases):", error);
        throw new Error(`Failed to fetch DHCP leases: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};

const makeLeaseStatic = async (leaseId) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        await conn.write('/ip/dhcp-server/lease/make-static', [`=.id=${leaseId}`]);
        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (makeLeaseStatic):", error);
        throw new Error(`Failed to make lease static: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};

const addDhcpLease = async (leaseData) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const command = [
            '/ip/dhcp-server/lease/add',
            `=mac-address=${leaseData.macAddress}`,
            `=address=${leaseData.address}`,
            `=server=${leaseData.server || 'all'}`, // <-- เพิ่ม server
        ];
        // --- START: เข้ารหัส Comment ---
        if (leaseData.comment) command.push(`=comment=${encodeToMikrotikHex(leaseData.comment)}`);
        // --- END ---
        
        await conn.write(command);
        
        // After adding, we need to find it and make it static
        const [addedLease] = await conn.write('/ip/dhcp-server/lease/print', [`?mac-address=${leaseData.macAddress}`, `?address=${leaseData.address}`]);

        if (addedLease) {
            await conn.write('/ip/dhcp-server/lease/make-static', [`=.id=${addedLease['.id']}`]);
        }

        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (addDhcpLease):", error);
        throw new Error(`Failed to add DHCP lease: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};


const updateDhcpLease = async (id, leaseData) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const command = [
            '/ip/dhcp-server/lease/set',
            `=.id=${id}`,
        ];
        if (leaseData.address) command.push(`=address=${leaseData.address}`);
        if (leaseData.macAddress) command.push(`=mac-address=${leaseData.macAddress}`);
        if (leaseData.server) command.push(`=server=${leaseData.server}`); // <-- เพิ่ม server
        // --- START: เข้ารหัส Comment ---
        if (leaseData.comment !== undefined) command.push(`=comment=${encodeToMikrotikHex(leaseData.comment)}`);
        // --- END ---
        
        await conn.write(command);
        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (updateDhcpLease):", error);
        throw new Error(`Failed to update DHCP lease: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};


const removeDhcpLeases = async (leaseIds) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const commands = leaseIds.map(id => ['/ip/dhcp-server/lease/remove', `=.id=${id}`]);
        for (const command of commands) {
            await conn.write(command[0], command.slice(1));
        }
        return { success: true, removedCount: leaseIds.length };
    } catch (error) {
        console.error("Mikrotik API Error (removeDhcpLeases):", error);
        throw new Error(`Failed to remove leases: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};


module.exports = {
    getDhcpLeases,
    makeLeaseStatic,
    addDhcpLease,
    updateDhcpLease,
    removeDhcpLeases,
};
