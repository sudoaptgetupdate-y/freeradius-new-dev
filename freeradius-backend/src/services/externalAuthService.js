// src/services/externalAuthService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (loginData) => {
    const loginSetting = await prisma.setting.findUnique({
      where: { key: 'externalLoginEnabled' }
    });

    if (loginSetting?.value !== 'true') {
      throw new Error('Login is currently disabled by the administrator.');
    }
    
    // --- 1. รับค่า magic และ post เข้ามาด้วย ---
    const { username, password, magic, post } = loginData;

    if (!username || !password) {
        throw new Error('Username and password are required.');
    }

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
          organization: {
            include: {
              advertisement: true
            }
          }
        }
    });

    if (!user) { throw new Error('Invalid credentials.'); }
    if (user.status !== 'active') { throw new Error('Your account is currently disabled.'); }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) { throw new Error('Invalid credentials.'); }

    // --- START: 2. เพิ่ม Logic ตรวจสอบโหมดการทำงาน ---
    if (magic && post) {
        // นี่คือโหมด Captive Portal
        const redirectUrl = `${post}?magic=${magic}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        return { action: 'redirect', redirectUrl: redirectUrl };
    } else {
        // นี่คือโหมด Firewall Authentication (เหมือนเดิม)
        const token = jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        const advertisement = user.organization.advertisement;
        const { password: _, organization, ...userWithoutPassword } = user;
        
        return { action: 'login', data: { token, user: userWithoutPassword, advertisement } };
    }
    // --- END ---
};

module.exports = {
    loginUser,
};