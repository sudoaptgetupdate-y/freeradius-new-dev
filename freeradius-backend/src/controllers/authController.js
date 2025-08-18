// src/controllers/authController.js
const prisma = require('../prisma'); // <-- แก้ไขจาก '../config/prisma'
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const admin = await prisma.administrator.findUnique({
      where: { username },
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    if (admin.status !== 'active') {
        return res.status(403).json({ message: 'Your account has been disabled. Please contact the administrator.' });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const { password: _, ...adminData } = admin;

    res.status(200).json({
      success: true,
      token,
      user: adminData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};