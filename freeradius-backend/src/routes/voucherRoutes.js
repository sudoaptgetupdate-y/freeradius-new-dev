// src/routes/voucherRoutes.js
const express = require('express');
const {
    createPackage,
    getPackages,
    updatePackage,
    deletePackage,
    generateVouchers,
    getBatches,
    getBatchById,
} = require('../controllers/voucherController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

// --- START: แก้ไขส่วนนี้ ---
// Package Management (Admin and Superadmin)
router.route('/packages')
    .get(authorize('superadmin', 'admin'), getPackages)
    .post(authorize('superadmin', 'admin'), createPackage);
router.route('/packages/:id')
    .put(authorize('superadmin', 'admin'), updatePackage)
    .delete(authorize('superadmin', 'admin'), deletePackage);
// --- END ---

// Voucher Generation and History (Admin and Superadmin)
router.post('/generate', authorize('superadmin', 'admin'), generateVouchers);
router.get('/batches', authorize('superadmin', 'admin'), getBatches);
router.get('/batches/:id', authorize('superadmin', 'admin'), getBatchById);


module.exports = router;