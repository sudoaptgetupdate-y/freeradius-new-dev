// src/routes/attributeRoutes.js
const express = require('express');
const { createAttribute, removeAttribute } = require('../controllers/attributeController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.post('/', createAttribute);
router.delete('/:type/:id', removeAttribute);

module.exports = router;