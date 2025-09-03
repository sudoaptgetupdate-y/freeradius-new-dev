// freeradius-backend/src/routes/mikrotikDhcpRoutes.js
const express = require('express');
const { 
    getLeases, 
    createLease,
    updateLease,
    makeStatic,
    deleteLeases,
} = require('../controllers/mikrotikDhcpController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/leases', getLeases);
router.post('/leases', createLease);
router.put('/leases/:id', updateLease);
router.post('/leases/:id/make-static', makeStatic);
router.post('/leases/delete', deleteLeases); // Using POST for bulk delete

module.exports = router;