// src/services/externalAuthService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const loginUser = async (loginData) => {
    const loginSetting = await prisma.setting.findUnique({
      where: { key: 'externalLoginEnabled' }
    });

    if (loginSetting?.value !== 'true') {
      throw new Error('Login is currently disabled by the administrator.');
    }
    
    // 1. รับค่า magic และ post เข้ามาด้วย
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
    
    // 2. ตรวจสอบว่านี่เป็นการ Login จาก Captive Portal หรือไม่
    if (magic && post) {
        // ถ้าใช่, ให้สร้าง URL สำหรับ Redirect กลับไปหา FortiGate
        console.log(`Captive Portal login successful for user: ${username}. Redirecting back to FortiGate.`);
        const redirectUrl = `${post}?magic=${magic}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        return { action: 'redirect', redirectUrl: redirectUrl };
    } else {
        // ถ้าไม่ใช่, ให้ทำงานเป็น Firewall Authentication เหมือนเดิม
        console.log(`Firewall Authentication successful for user: ${username}.`);
        const advertisement = user.organization.advertisement;
        const { password: _, organization, ...userWithoutPassword } = user;
        
        return { action: 'login', data: { user: userWithoutPassword, advertisement: advertisement } };
    }
};

module.exports = {
    loginUser,
};