// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  let token;

  // 1. ตรวจสอบว่ามี Token ส่งมาใน Header หรือไม่
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. ดึง Token ออกมาจาก Header (ตัดคำว่า 'Bearer ' ออก)
      token = req.headers.authorization.split(' ')[1];

      // 3. ตรวจสอบความถูกต้องของ Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. ค้นหาผู้ใช้จาก id ที่อยู่ใน Token และแนบข้อมูลไปกับ request
      // เราไม่ต้องการรหัสผ่าน เลยใช้ -password
      req.admin = await prisma.administrator.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, role: true },
      });

      if (!req.admin) {
         return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
      }

      next(); // ถ้าทุกอย่างถูกต้อง ให้ไปที่ด่านต่อไป
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };