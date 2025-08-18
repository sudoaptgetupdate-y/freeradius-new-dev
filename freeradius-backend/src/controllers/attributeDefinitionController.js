// src/controllers/attributeDefinitionController.js
const service = require('../services/attributeDefinitionService');

const getAllDefinitions = async (req, res, next) => {
  try {
    const definitions = await service.getAll();
    res.status(200).json({ success: true, data: definitions });
  } catch (error) {
    next(error);
  }
};

const createDefinition = async (req, res, next) => {
  try {
    const newDefinition = await service.create(req.body);
    res.status(201).json({ success: true, data: newDefinition });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateDefinition = async (req, res, next) => {
  try {
    const updated = await service.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteDefinition = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Attribute definition deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
    getAllDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinition
};