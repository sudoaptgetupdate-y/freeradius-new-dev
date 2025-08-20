// src/routes/logManagerRoutes.js
const express = require('express');
const {
    getDashboardData,
    getLogFiles,
    downloadLogFile,
    getSystemConfig,
    getDownloadHistory,
    getLogVolumeGraph,
    updateDeviceIps,
    updateLogSettings,
    getHostnames
} = require('../controllers/logManagerController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Protect all routes and authorize only superadmins
router.use(protect);
router.use(authorize('superadmin'));

router.get('/dashboard', getDashboardData);
router.get('/files', getLogFiles);
router.get('/files/download', downloadLogFile);
router.get('/config', getSystemConfig);
router.get('/history', getDownloadHistory);
router.get('/hostnames', getHostnames);
router.get('/volume-graph', getLogVolumeGraph);

// --- Routes for updating configuration ---
router.post('/config/ips', updateDeviceIps);
router.post('/config/settings', updateLogSettings);

module.exports = router;