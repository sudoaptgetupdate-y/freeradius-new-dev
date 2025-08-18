// src/controllers/voucherController.js
const voucherService = require('../services/voucherService');

const createPackage = async (req, res, next) => {
  try {
    const newPackage = await voucherService.createVoucherPackage(req.body);
    res.status(201).json({ success: true, data: newPackage });
  } catch (error) {
    next(error);
  }
};

const getPackages = async (req, res, next) => {
  try {
    const packages = await voucherService.getAllVoucherPackages();
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const updatedPackage = await voucherService.updateVoucherPackage(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedPackage });
  } catch (error) {
    next(error);
  }
};

const deletePackage = async (req, res, next) => {
  try {
    await voucherService.deleteVoucherPackage(req.params.id);
    res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const generateVouchers = async (req, res, next) => {
    try {
        const adminId = req.admin.id;
        const result = await voucherService.generateVouchers(req.body, adminId);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getBatches = async (req, res, next) => {
    try {
        const batches = await voucherService.getVoucherBatches(req.query); // ส่ง query ไปยัง service
        res.status(200).json({ success: true, data: batches });
    } catch (error) {
        next(error);
    }
};

const getBatchById = async (req, res, next) => {
    try {
        const batch = await voucherService.getVoucherBatchById(req.params.id);
        res.status(200).json({ success: true, data: batch });
    } catch (error) {
        next(error);
    }
};


module.exports = {
  createPackage,
  getPackages,
  updatePackage,
  deletePackage,
  generateVouchers,
  getBatches,
  getBatchById,
};