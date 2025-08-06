// src/routes/statusRoutes.js
const express = require('express');
const { getStatus, restartService } = require('../controllers/statusController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ป้องกันทุก Route และอนุญาตให้ Super Admin เท่านั้นที่จัดการ Service ได้
router.use(protect);
router.use(authorize('superadmin'));

// GET /api/status -> ดูสถานะ service
router.get('/', getStatus);

// POST /api/status/restart -> สั่ง restart service
router.post('/restart', restartService);

module.exports = router;