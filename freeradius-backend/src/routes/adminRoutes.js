// src/routes/adminRoutes.js
const express = require('express');
const { createNewAdmin, getAllAdmins, deleteAdminById, getAdmin, updateAdmin } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware'); // Import ยามคนแรก
const { authorize } = require('../middlewares/roleMiddleware'); // Import ยามคนที่สอง
const router = express.Router();

// เพิ่มด่านตรวจ: ต้อง Login (protect) และต้องเป็น 'superadmin' (authorize) เท่านั้น
router.use(protect);
router.use(authorize('superadmin'));

// Routes ด้านล่างทั้งหมดจะถูกป้องกันโดยอัตโนมัติ
router.post('/', createNewAdmin);
router.get('/', getAllAdmins);
router.get('/:id', getAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdminById);

module.exports = router;