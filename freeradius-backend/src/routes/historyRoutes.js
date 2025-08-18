// src/routes/historyRoutes.js
const express = require('express');
const { getHistory } = require('../controllers/historyController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ป้องกัน Route ให้เฉพาะ Admin ที่ Login แล้วเท่านั้นที่ดูได้
router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', getHistory);

module.exports = router;