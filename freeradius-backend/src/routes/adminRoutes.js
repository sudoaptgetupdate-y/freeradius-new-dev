// src/routes/adminRoutes.js
const express = require('express');
const { createNewAdmin, getAllAdmins, deleteAdminById, getAdmin, updateAdmin, toggleStatus } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const router = express.Router();

// ใช้ protect กับทุก route ในไฟล์นี้
router.use(protect);

// --- START: แก้ไขส่วนนี้ ---
// GET routes: อนุญาตให้ทั้ง superadmin และ admin เข้าถึงได้
router.get('/', authorize('superadmin', 'admin'), getAllAdmins);
router.get('/:id', authorize('superadmin', 'admin'), getAdmin);

// POST, PUT, DELETE routes: อนุญาตให้เฉพาะ superadmin เท่านั้น
router.post('/', authorize('superadmin'), createNewAdmin);
router.put('/:id', authorize('superadmin'), updateAdmin);
router.put('/:id/status', authorize('superadmin'), toggleStatus);
router.delete('/:id', authorize('superadmin'), deleteAdminById);
// --- END ---

module.exports = router;