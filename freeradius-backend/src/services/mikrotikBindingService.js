// freeradius-backend/src/services/mikrotikBindingService.js
const { RouterOSAPI } = require('routeros-api');
const prisma = require('../prisma');
const { decrypt } = require('../utils/crypto');
const { encodeToMikrotikHex, decodeFromMikrotikHex } = require('../utils/mikrotikUtils');

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
        charset: 'utf8'
    });

    await conn.connect();
    return conn;
};

const getBindings = async (filters) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const bindings = await conn.write('/ip/hotspot/ip-binding/print');

        const decodedBindings = bindings.map(binding => ({
            ...binding,
            comment: decodeFromMikrotikHex(binding.comment)
        }));

        let filteredData = decodedBindings;
        const { searchTerm, type, page = 1, limit = 10 } = filters;

        if (searchTerm || type) {
            const lowercasedFilter = searchTerm ? searchTerm.toLowerCase() : '';
            filteredData = decodedBindings.filter(binding => {
                const typeMatch = type ? binding.type === type : true;
                const searchTermMatch = searchTerm ?
                    (binding['mac-address'] && binding['mac-address'].toLowerCase().includes(lowercasedFilter)) ||
                    (binding.address && binding.address.toLowerCase().includes(lowercasedFilter)) ||
                    (binding.comment && binding.comment.toLowerCase().includes(lowercasedFilter))
                    : true;
                return typeMatch && searchTermMatch;
            });
        }

        const totalItems = filteredData.length;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedData = filteredData.slice(startIndex, startIndex + limitNum);

        return {
            data: paginatedData,
            totalItems,
            totalPages: Math.ceil(totalItems / limitNum),
            currentPage: pageNum,
        };

    } catch (error) {
        console.error("Mikrotik API Error (getBindings):", error);
        throw new Error(`Failed to fetch IP bindings: ${error.message}`);
    } finally {
        if (conn && conn.connected) {
            await conn.close();
        }
    }
};

const addBinding = async (bindingData) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        const command = [
            '/ip/hotspot/ip-binding/add',
            `=mac-address=${bindingData.macAddress}`,
            `=type=${bindingData.type}`,
        ];
        if (bindingData.address) command.push(`=address=${bindingData.address}`);
        if (bindingData.toAddress) command.push(`=to-address=${bindingData.toAddress}`);
        if (bindingData.server) command.push(`=server=${bindingData.server}`); // Add server parameter
        if (bindingData.comment) command.push(`=comment=${encodeToMikrotikHex(bindingData.comment)}`);
        
        await conn.write(command);
        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (addBinding):", error);
        throw new Error(`Failed to add IP binding: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};

const updateBinding = async (id, bindingData) => {
    let conn;
    try {
        conn = await connectToMikrotik();

        // Instead of remove/add, we use the 'set' command which is safer
        const command = [
            '/ip/hotspot/ip-binding/set',
            `=.id=${id}`,
            `=mac-address=${bindingData.macAddress}`,
            `=type=${bindingData.type}`,
        ];

        // Add optional fields if they have a value
        if (bindingData.address) command.push(`=address=${bindingData.address}`);
        if (bindingData.toAddress) command.push(`=to-address=${bindingData.toAddress}`);
        if (bindingData.server) command.push(`=server=${bindingData.server}`); // Add server parameter
        if (bindingData.comment) command.push(`=comment=${encodeToMikrotikHex(bindingData.comment)}`);
        
        await conn.write(command);
        return { success: true };

    } catch (error) {
        console.error("Mikrotik API Error (updateBinding):", error);
        throw new Error(`Failed to update IP binding: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};

const deleteBinding = async (id) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        await conn.write('/ip/hotspot/ip-binding/remove', [`=.id=${id}`]);
        return { success: true };
    } catch (error) {
        console.error("Mikrotik API Error (deleteBinding):", error);
        throw new Error(`Failed to delete IP binding: ${error.message}`);
    } finally {
        if (conn && conn.connected) await conn.close();
    }
};


module.exports = {
    getBindings,
    addBinding,
    updateBinding,
    deleteBinding,
};
