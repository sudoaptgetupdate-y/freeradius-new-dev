// freeradius-backend/src/controllers/mikrotikBindingController.js
const bindingService = require('../services/mikrotikBindingService');

const getBindings = async (req, res, next) => {
    try {
        const bindings = await bindingService.getIpBindings();
        res.status(200).json({ success: true, data: bindings });
    } catch (error) {
        next(error);
    }
};

const addBinding = async (req, res, next) => {
    try {
        await bindingService.addIpBinding(req.body);
        res.status(201).json({ success: true, message: 'IP Binding added successfully.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const removeBinding = async (req, res, next) => {
    try {
        await bindingService.removeIpBinding(req.params.id);
        res.status(200).json({ success: true, message: 'IP Binding removed successfully.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getBindings,
    addBinding,
    removeBinding,
};