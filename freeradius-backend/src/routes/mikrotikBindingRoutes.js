// freeradius-backend/src/routes/mikrotikBindingRoutes.js
const express = require('express');
const {
    getBindings,
    createBinding,
    updateBinding,
    deleteBinding
} = require('../controllers/mikrotikBindingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', getBindings);
router.post('/', createBinding);
router.put('/:id', updateBinding);
router.delete('/:id', deleteBinding);

module.exports = router;