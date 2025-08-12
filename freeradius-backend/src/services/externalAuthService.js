// src/services/externalAuthService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // <-- 1. Import jwt

const loginUser = async (loginData) => {
    const loginSetting = await prisma.setting.findUnique({
      where: { key: 'externalLoginEnabled' }
    });

    if (loginSetting?.value !== 'true') {
      throw new Error('Login is currently disabled by the administrator.');
    }
    
    const { username, password } = loginData;

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

    if (!user) {
        throw new Error('Invalid credentials.');
    }

    if (user.status !== 'active') {
        throw new Error('Your account is currently disabled. Please contact an administrator.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
        throw new Error('Invalid credentials.');
    }
    
    // --- START: 2. ส่วนที่เพิ่มเข้ามา ---
    // สร้าง Token สำหรับ User คนนี้
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    // --- END ---
    
    const advertisement = user.organization.advertisement;
    const { password: _, organization, ...userWithoutPassword } = user;
    
    // 3. ส่ง token กลับไปด้วย
    return { token, user: userWithoutPassword, advertisement: advertisement };
};

module.exports = {
    loginUser,
};