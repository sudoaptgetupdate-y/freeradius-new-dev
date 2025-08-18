// src/routes/externalAuthRoutes.js
const express = require('express');
const { login } = require('../controllers/externalAuthController');

const router = express.Router();

router.post('/login', login);

module.exports = router;