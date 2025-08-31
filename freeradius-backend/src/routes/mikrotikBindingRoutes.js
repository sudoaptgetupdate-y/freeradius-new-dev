// freeradius-backend/src/routes/mikrotikBindingRoutes.js
const express = require('express');
const { getBindings, addBinding, updateBinding, removeBinding } = require('../controllers/mikrotikBindingController'); // <-- Import new controller
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
    .get(getBindings)
    .post(addBinding);

router.route('/:id')
    .put(updateBinding) // <-- Add PUT route for updates
    .delete(removeBinding);

module.exports = router;