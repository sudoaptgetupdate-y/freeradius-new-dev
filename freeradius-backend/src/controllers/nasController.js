// src/controllers/nasController.js
const nasService = require('../services/nasService');

const getAllNas = async (req, res, next) => {
  try {
    const allNas = await nasService.getAllNas();
    res.status(200).json({ success: true, data: allNas });
  } catch (error) {
    next(error);
  }
};

const createNas = async (req, res, next) => {
  try {
    const newNas = await nasService.createNas(req.body);
    res.status(201).json({ success: true, data: newNas });
  } catch (error) {
    next(error);
  }
};

const getNas = async (req, res, next) => {
    try {
        const nas = await nasService.getNasById(req.params.id);
        res.status(200).json({ success: true, data: nas });
    } catch (error) {
        next(error);
    }
};

const updateNas = async (req, res, next) => {
    try {
        const updatedNas = await nasService.updateNas(req.params.id, req.body);
        res.status(200).json({ success: true, data: updatedNas });
    } catch (error) {
        next(error);
    }
};

const deleteNasById = async (req, res, next) => {
    try {
        await nasService.deleteNas(req.params.id);
        res.status(200).json({ success: true, message: 'NAS deleted successfully' });
    } catch (error) {
        // ดักจับ Error ที่เราสร้างขึ้นเองและส่ง status 400 กลับไป
        if (error.message.includes('currently online')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        // หากเป็น Error อื่นๆ ให้ส่งต่อไปยัง error handler หลัก
        next(error);
    }
};

module.exports = {
  getAllNas,
  createNas,
  getNas,
  updateNas,
  deleteNasById,
};