// freeradius-backend/src/routes/mikrotikHotspotRoutes.js
const express = require('express');
const { getActiveHosts, getHosts, kickHosts, createBindings } = require('../controllers/mikrotikHotspotController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/active', getActiveHosts);
router.get('/hosts', getHosts);
router.post('/kick', kickHosts);
router.post('/bindings', createBindings);

module.exports = router;