// freeradius-backend/src/controllers/mikrotikDhcpController.js
const dhcpService = require('../services/mikrotikDhcpService');

const getLeases = async (req, res, next) => {
    try {
        const leases = await dhcpService.getDhcpLeases(req.query);
        res.status(200).json({ success: true, data: leases });
    } catch (error) {
        next(error);
    }
};

const createLease = async (req, res, next) => {
    try {
        const result = await dhcpService.addDhcpLease(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateLease = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await dhcpService.updateDhcpLease(id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const makeStatic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await dhcpService.makeLeaseStatic(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const deleteLeases = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Lease IDs array is required.' });
        }
        const result = await dhcpService.removeDhcpLeases(ids);
        res.status(200).json({ success: true, message: `${result.removedCount} lease(s) removed successfully.`, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLeases,
    createLease,
    updateLease,
    makeStatic,
    deleteLeases,
};