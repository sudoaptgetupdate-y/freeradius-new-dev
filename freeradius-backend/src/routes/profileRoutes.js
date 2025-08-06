// src/routes/profileRoutes.js
const express = require('express');
const { getProfiles, createProfile, getProfile, removeProfile } = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ใช้ middleware ป้องกันทุก route ในไฟล์นี้
router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', getProfiles);
router.post('/', createProfile);
router.get('/:id', getProfile);
router.delete('/:id', removeProfile); // <-- เพิ่ม Route ใหม่

module.exports = router;