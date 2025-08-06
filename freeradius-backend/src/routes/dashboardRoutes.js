// src/routes/dashboardRoutes.js
const express = require('express');
const { getDashboardStats, getOnlineUsersGraphData } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', getDashboardStats);
router.get('/online-users-graph', getOnlineUsersGraphData);

module.exports = router;