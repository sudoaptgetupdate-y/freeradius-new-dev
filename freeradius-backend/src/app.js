// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const nasRoutes = require('./routes/nasRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorHandler');
const adminRoutes = require('./routes/adminRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const statusRoutes = require('./routes/statusRoutes');
const historyRoutes = require('./routes/historyRoutes');
const onlineUserRoutes = require('./routes/onlineUserRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const registerRoutes = require('./routes/registerRoutes');

const app = express();
// ... middlewares ...
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is healthy' });
});

app.use('/api/register', registerRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/nas', nasRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/online-users', onlineUserRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Error Handler Middleware ---
app.use(errorHandler);

module.exports = app;