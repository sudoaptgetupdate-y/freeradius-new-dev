// src/routes/profileRoutes.js
const express = require('express');
const { getProfiles, createProfile, getProfile, removeProfile, updateProfile } = require('../controllers/profileController'); // <-- เพิ่ม updateProfile
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', getProfiles);
router.post('/', createProfile);
router.get('/:id', getProfile);
router.put('/:id', updateProfile); // <-- เพิ่ม Route ใหม่สำหรับ PUT
router.delete('/:id', removeProfile);

module.exports = router;