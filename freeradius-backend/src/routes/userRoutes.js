// freeradius-backend/src/routes/userRoutes.js

const express = require('express');
const { 
  createUser, 
  getUsers, 
  deleteUser, 
  updateUser, 
  getUser,
  moveUsersToOrganization // <-- Import ฟังก์ชันใหม่
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const router = express.Router();

// ป้องกันทุก Route ในไฟล์นี้: ต้อง Login และมี Role ที่ถูกต้อง
router.use(protect);
router.use(authorize('superadmin', 'admin'));

// Route Definitions
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:username', getUser);
router.delete('/:username', deleteUser);
router.put('/:username', updateUser);

// --- START: Route ที่เพิ่มเข้ามาใหม่ ---
// Route นี้ต้องอยู่เหนือ Route ที่มี parameter เช่น /:username เพื่อไม่ให้ Express สับสน
router.post('/bulk-move', moveUsersToOrganization);
// --- END: Route ที่เพิ่มเข้ามาใหม่ ---

module.exports = router;