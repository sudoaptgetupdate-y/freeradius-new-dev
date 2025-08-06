// src/controllers/authController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // 1. ตรวจสอบว่ามี username และ password ส่งมาหรือไม่
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // 2. ค้นหา admin ด้วย username จากตาราง administrator
    const admin = await prisma.administrator.findUnique({
      where: { username },
    });

    // 3. ถ้าไม่เจอ user หรือรหัสผ่านไม่ตรงกัน
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    // 4. ถ้าทุกอย่างถูกต้อง ให้สร้าง Token
    const token = jwt.sign(
      { id: admin.id, role: admin.role }, // Payload ที่จะเก็บใน Token
      process.env.JWT_SECRET, // กุญแจลับจากไฟล์ .env
      { expiresIn: process.env.JWT_EXPIRES_IN } // ตั้งค่าวันหมดอายุจากไฟล์ .env
    );

    // 5. ส่ง Token กลับไปให้ผู้ใช้
    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};