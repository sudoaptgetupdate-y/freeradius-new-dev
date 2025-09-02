// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

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
const attributeDefinitionRoutes = require('./routes/attributeDefinitionRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const externalAuthRoutes = require('./routes/externalAuthRoutes');
const advertisementRoutes = require('./routes/advertisementRoutes'); 
const userPortalRoutes = require('./routes/userPortalRoutes');
const logManagerRoutes = require('./routes/logManagerRoutes');
const mikrotikApiRoutes = require('./routes/mikrotikApiRoutes');
const mikrotikProfileRoutes = require('./routes/mikrotikProfileRoutes');
const mikrotikBindingRoutes = require('./routes/mikrotikBindingRoutes');
const mikrotikHotspotRoutes = require('./routes/mikrotikHotspotRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '../public')));

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is healthy' });
});

app.use('/api/register', registerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/nas', nasRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/radius-profiles', profileRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/attribute-definitions', attributeDefinitionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/online-users', onlineUserRoutes);
app.use('/api/external-auth', externalAuthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/portal', userPortalRoutes);
app.use('/api/logs', logManagerRoutes);
app.use('/api/mikrotik', mikrotikApiRoutes);
app.use('/api/mikrotik-profiles', mikrotikProfileRoutes);
app.use('/api/mikrotik/bindings', mikrotikBindingRoutes);
app.use('/api/mikrotik/hotspot', mikrotikHotspotRoutes);

// --- Error Handler Middleware ---
app.use(errorHandler);

module.exports = app;