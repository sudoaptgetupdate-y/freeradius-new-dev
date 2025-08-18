// src/controllers/attributeController.js
const attributeService = require('../services/attributeService');

const createAttribute = async (req, res, next) => {
  try {
    const { profileName, type, ...attributeData } = req.body;
    const newAttribute = await attributeService.addAttribute(profileName, type, attributeData);
    res.status(201).json({ success: true, data: newAttribute });
  } catch (error) {
    next(error);
  }
};

const removeAttribute = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    await attributeService.deleteAttribute(id, type);
    res.status(200).json({ success: true, message: 'Attribute deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAttribute,
  removeAttribute,
};