// src/routes/userPortalRoutes.js
const express = require('express');
const { 
    loginUser,
    getProfile,
    updateProfile,
    changePassword,
    clearSessions
} = require('../controllers/userPortalController');
const { protectUser } = require('../middlewares/protectUser');

const router = express.Router();

router.post('/login', loginUser);

// --- เพิ่ม Routes ที่ป้องกันด้วย protectUser ---
router.get('/me', protectUser, getProfile);
router.put('/me', protectUser, updateProfile);
router.post('/me/change-password', protectUser, changePassword);
router.post('/me/clear-sessions', protectUser, clearSessions);

module.exports = router;