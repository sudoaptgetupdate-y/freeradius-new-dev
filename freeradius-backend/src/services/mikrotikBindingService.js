// freeradius-backend/src/services/mikrotikBindingService.js
const { RouterOSAPI } = require('routeros-api');
const prisma = require('../prisma');
const { decrypt } = require('../utils/crypto');
// VVVV เพิ่มการ import ฟังก์ชัน decode และ encode VVVV
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
        charset: 'utf8' // Ensure charset is set for proper encoding handling
    });

    await conn.connect();
    return conn;
};

const getBindings = async (filters) => {
    let conn;
    try {
        conn = await connectToMikrotik();
        
        const query = ['/ip/hotspot/ip-binding/print'];
        const whereClauses = [];
        
        if (filters.searchTerm) {
            const term = filters.searchTerm;
            whereClauses.push(`?mac-address=${term}`, `?address=${term}`, `?comment=${term}`);
        }
        if (filters.type) {
            whereClauses.push(`?type=${filters.type}`);
        }

        // Note: RouterOS API doesn't support complex OR queries easily. 
        // We'll fetch and filter in-app for more complex searches.
        // For simplicity, this example will just fetch all if searchTerm is complex.
        
        const bindings = await conn.write(query);

        // VVVV START: ส่วนที่แก้ไข VVVV
        // Decode the comment field for each binding before sending it to the frontend
        const decodedBindings = bindings.map(binding => ({
            ...binding,
            comment: decodeFromMikrotikHex(binding.comment)
        }));
        // VVVV END: ส่วนที่แก้ไข VVVV


        // Manual filtering for search term across multiple fields
        const { searchTerm } = filters;
        if (!searchTerm) {
            return decodedBindings; // <-- ส่งข้อมูลที่ถอดรหัสแล้ว
        }

        const lowercasedFilter = searchTerm.toLowerCase();

        return decodedBindings.filter(binding => // <-- กรองจากข้อมูลที่ถอดรหัสแล้ว
            (binding['mac-address'] && binding['mac-address'].toLowerCase().includes(lowercasedFilter)) ||
            (binding.address && binding.address.toLowerCase().includes(lowercasedFilter)) ||
            (binding.comment && binding.comment.toLowerCase().includes(lowercasedFilter))
        );

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
        // Encode comment before sending to Mikrotik
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
        const command = [
            '/ip/hotspot/ip-binding/set',
            `=.id=${id}`,
            `=mac-address=${bindingData.macAddress}`,
            `=type=${bindingData.type}`,
        ];
        if (bindingData.address) command.push(`=address=${bindingData.address}`);
        if (bindingData.toAddress) command.push(`=to-address=${bindingData.toAddress}`);
        // Encode comment before sending to Mikrotik
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