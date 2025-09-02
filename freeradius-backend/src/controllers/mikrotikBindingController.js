// freeradius-backend/src/controllers/mikrotikBindingController.js
const bindingService = require('../services/mikrotikBindingService');

const getBindings = async (req, res, next) => {
    try {
        const result = await bindingService.getBindings(req.query);
        res.status(200).json({
            success: true,
            data: result.data,
            pagination: {
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
                itemsPerPage: parseInt(req.query.limit, 10) || 10,
            }
        });
    } catch (error) {
        next(error);
    }
};

const createBinding = async (req, res, next) => {
    try {
        const result = await bindingService.addBinding(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateBinding = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await bindingService.updateBinding(id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const deleteBinding = async (req, res, next) => {
    try {
        const { id } = req.params;
        await bindingService.deleteBinding(id);
        res.status(200).json({ success: true, message: 'Binding deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBindings,
    createBinding,
    updateBinding,
    deleteBinding,
};