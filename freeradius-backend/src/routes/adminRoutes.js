// src/routes/adminRoutes.js
const express = require('express');
const { createNewAdmin, getAllAdmins, deleteAdminById, getAdmin, updateAdmin, toggleStatus } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const router = express.Router();

// ใช้ protect กับทุก route ในไฟล์นี้
router.use(protect);

// GET routes: อนุญาตให้ทั้ง superadmin และ admin เข้าถึงได้
router.get('/', authorize('superadmin', 'admin'), getAllAdmins);
router.get('/:id', authorize('superadmin', 'admin'), getAdmin);

// POST, DELETE routes: อนุญาตให้เฉพาะ superadmin เท่านั้น
router.post('/', authorize('superadmin'), createNewAdmin);
router.put('/:id/status', authorize('superadmin'), toggleStatus);
router.delete('/:id', authorize('superadmin'), deleteAdminById);

// PUT route: อนุญาตให้ superadmin และ admin เข้าถึงได้ (แต่จะไปเช็คสิทธิ์ละเอียดใน controller)
router.put('/:id', authorize('superadmin', 'admin'), updateAdmin);
// --- END ---

module.exports = router;