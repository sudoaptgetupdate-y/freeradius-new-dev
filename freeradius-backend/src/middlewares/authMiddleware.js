// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../prisma'); // <-- แก้ไขจาก '../config/prisma'

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.admin = await prisma.administrator.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, role: true },
      });

      if (!req.admin) {
         return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };