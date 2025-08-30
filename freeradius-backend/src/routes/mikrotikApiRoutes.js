// freeradius-backend/src/routes/mikrotikApiRoutes.js
const express = require('express');
const { getConfig, saveConfig, testConnection } = require('../controllers/mikrotikApiController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/settings')
    .get(getConfig)
    .post(saveConfig);

router.route('/settings/test-connection')
    .post(testConnection);

module.exports = router;