// src/routes/registerRoutes.js
const express = require('express');
const { registerUser } = require('../controllers/registerController');

const router = express.Router();

// Route นี้เป็น Public ไม่ต้องมีการป้องกัน
router.post('/', registerUser);

module.exports = router;