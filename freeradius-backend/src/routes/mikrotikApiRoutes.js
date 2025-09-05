// freeradius-backend/src/routes/mikrotikApiRoutes.js
const express = require('express');
const { getConfig, saveConfig, testConnection, getConnectionStatus } = require('../controllers/mikrotikApiController'); // <-- เพิ่ม getConnectionStatus
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

// --- START: โค้ดที่แก้ไข ---
router.route('/settings')
    .get(getConfig)
    .post(saveConfig);

router.route('/settings/test-connection')
    .post(testConnection);
    
router.route('/settings/status') // <-- เพิ่ม Route ใหม่
    .get(getConnectionStatus);
// --- END ---

module.exports = router;