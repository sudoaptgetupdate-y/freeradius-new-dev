// src/controllers/authController.js
const prisma = require('../config/prisma');
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

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // --- START: แก้ไขส่วนนี้ ---
    // 1. ลบรหัสผ่านออกจาก object ก่อนส่งกลับ
    const { password: _, ...adminData } = admin;

    // 2. ส่งข้อมูล admin (ที่ไม่มีรหัสผ่าน) กลับไปพร้อมกับ token
    res.status(200).json({
      success: true,
      token,
      user: adminData, // <--- เพิ่ม user data ใน response
    });
    // --- END: สิ้นสุดส่วนที่แก้ไข ---

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};