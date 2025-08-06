// freeradius-backend/src/routes/userRoutes.js

const express = require('express');
const { 
  createUser, 
  getUsers, 
  deleteUser, 
  updateUser, 
  getUser,
  moveUsersToOrganization,
  deleteMultipleUsers
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
router.post('/bulk-move', moveUsersToOrganization);
router.post('/bulk-delete', deleteMultipleUsers);
router.get('/:username', getUser);
router.delete('/:username', deleteUser);
router.put('/:username', updateUser);

module.exports = router;