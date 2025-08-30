// freeradius-backend/src/routes/mikrotikBindingRoutes.js
const express = require('express');
const { getBindings, addBinding, removeBinding } = require('../controllers/mikrotikBindingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
    .get(getBindings)
    .post(addBinding);

router.route('/:id')
    .delete(removeBinding);

module.exports = router;