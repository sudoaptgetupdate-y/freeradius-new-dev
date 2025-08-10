// src/middlewares/protectUser.js
const jwt = require('jsonwebtoken');
const prisma = require('../prisma'); // <-- แก้ไขจาก '../config/prisma'

const protectUser = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, organizationId: true },
      });

      if (!req.user) {
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

module.exports = { protectUser };