// freeradius-backend/src/controllers/mikrotikHotspotController.js
const hotspotService = require('../services/mikrotikHotspotService');

const getActiveHosts = async (req, res, next) => {
    try {
        const hosts = await hotspotService.getHotspotActiveHosts(req.query);
        res.status(200).json({ success: true, data: hosts });
    } catch (error) {
        next(error);
    }
};

const kickHosts = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Host IDs array is required.' });
        }
        const result = await hotspotService.removeHotspotActiveHosts(ids);
        res.status(200).json({ success: true, message: `${result.removedCount} host(s) kicked successfully.`, data: result });
    } catch (error) {
        next(error);
    }
};

const createBindings = async (req, res, next) => {
    try {
        const { hosts, type } = req.body;
        if (!hosts || !Array.isArray(hosts) || hosts.length === 0 || !type) {
            return res.status(400).json({ success: false, message: 'Hosts array and binding type are required.' });
        }
        const result = await hotspotService.makeBindingForHosts(hosts, type);
        res.status(201).json({ success: true, message: `${result.createdCount} binding(s) created successfully.`, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getActiveHosts,
    kickHosts,
    createBindings,
};