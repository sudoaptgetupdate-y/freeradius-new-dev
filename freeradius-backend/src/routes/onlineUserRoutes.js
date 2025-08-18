// src/routes/onlineUserRoutes.js
const express = require('express');
const { listOnlineUsers, kickUser, clearStale } = require('../controllers/onlineUsersController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ป้องกันทุก Route ให้เฉพาะ Admin ที่ Login แล้วเท่านั้น
router.use(protect);
router.use(authorize('superadmin', 'admin'));

// GET /api/online-users -> ดูรายชื่อผู้ใช้ออนไลน์
router.get('/', listOnlineUsers);

// POST /api/online-users/kick -> สั่ง Kick User
router.post('/kick', kickUser);

// POST /api/online-users/clear-stale -> เคลียร์ Session ที่ค้าง
router.post('/clear-stale', clearStale);

module.exports = router;