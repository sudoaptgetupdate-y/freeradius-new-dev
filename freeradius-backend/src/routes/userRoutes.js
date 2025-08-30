// freeradius-backend/src/routes/userRoutes.js
const express = require('express');
const multer = require('multer'); // 👈 1. Import multer
const {
  createUser,
  getUsers,
  deleteUser,
  updateUser,
  getUser,
  moveUsersToOrganization,
  deleteMultipleUsers,
  toggleUserStatus,
  importUsers, // 👈 2. Import controller ใหม่
  approveMultipleUsers, // <-- ADDED
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const router = express.Router();

// 👈 3. ตั้งค่า Multer ให้เก็บไฟล์ชั่วคราวในโฟลเดอร์ uploads
const upload = multer({ dest: 'uploads/' });

// ป้องกันทุก Route ในไฟล์นี้
router.use(protect);
router.use(authorize('superadmin', 'admin'));

// Route Definitions
router.post('/', createUser);
router.get('/', getUsers);
router.post('/bulk-move', moveUsersToOrganization);
router.post('/bulk-delete', deleteMultipleUsers);
router.post('/bulk-approve', approveMultipleUsers); // <-- ADDED
router.put('/:username/status', toggleUserStatus);
router.get('/:username', getUser);
router.delete('/:username', deleteUser);
router.put('/:username', updateUser);

//4. เพิ่ม Route ใหม่สำหรับ Import
router.post('/import', upload.single('file'), importUsers);

module.exports = router;