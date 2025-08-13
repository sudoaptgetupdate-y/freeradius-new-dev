// src/routes/nasRoutes.js
const express = require('express');
const { getAllNas, createNas, getNas, updateNas, deleteNasById } = require('../controllers/nasController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
// --- START: แก้ไขส่วนนี้ ---
router.use(authorize('superadmin'));
// --- END ---

router.get('/', getAllNas);
router.post('/', createNas);
router.get('/:id', getNas);
router.put('/:id', updateNas);
router.delete('/:id', deleteNasById);

module.exports = router;