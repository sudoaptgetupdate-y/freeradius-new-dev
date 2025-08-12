// src/services/externalAuthService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execFile } = require('child_process');
const os = require('os');

// --- START: เพิ่มฟังก์ชันใหม่สำหรับยิง RADIUS Auth ---
const performRadiusAuth = (username, password) => {
  return new Promise((resolve, reject) => {
    if (os.platform() !== 'linux') {
      console.log(`[AUTH] Simulating RADIUS auth for user ${username} on non-linux OS.`);
      return resolve(true); // บนเครื่องที่ไม่ใช่ Linux ให้ผ่านเสมอ
    }

    const command = '/usr/bin/radclient';
    const args = ['-x', 'localhost:1812', 'auth', process.env.RADIUS_SECRET || 'testing123'];
    const stdinData = `User-Name="${username}",User-Password="${password}"`;

    console.log(`[AUTH] Performing RADIUS auth for user: ${username}`);
    const child = execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        console.error(`[AUTH] radclient error: ${stderr}`);
        return reject(new Error('RADIUS authentication failed.'));
      }
      if (stdout.includes('Access-Accept')) {
        console.log(`[AUTH] Received Access-Accept for user: ${username}`);
        resolve(true);
      } else {
        console.log(`[AUTH] Received Access-Reject for user: ${username}. Output: ${stdout}`);
        reject(new Error('Invalid credentials.'));
      }
    });

    child.stdin.write(stdinData);
    child.stdin.end();
  });
};
// --- END ---

const loginUser = async (loginData) => {
    const loginSetting = await prisma.setting.findUnique({
      where: { key: 'externalLoginEnabled' }
    });

    if (loginSetting?.value !== 'true') {
      throw new Error('Login is currently disabled by the administrator.');
    }
    
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
    
    // 1. ตรวจสอบรหัสผ่านกับ DB ก่อน (ยังคงเดิม)
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) { throw new Error('Invalid credentials.'); }
    
    // --- START: แก้ไข Logic ส่วนนี้ ---
    // 2. ทำการยืนยันตัวตนผ่าน RADIUS จริงๆ
    await performRadiusAuth(username, password);

    // 3. ทำงานส่วนที่เหลือตามปกติ
    if (magic && post) {
        // === CAPTIVE PORTAL MODE === (แก้ไขเฉพาะส่วนนี้)
        console.log(`Captive Portal login successful for user: ${username}. Redirecting back to FortiGate.`);
        // ส่งเฉพาะ magic และ username กลับไป (ไม่ส่ง password)
        const redirectUrl = `${post}?magic=${magic}&username=${encodeURIComponent(username)}`;
        return { action: 'redirect', redirectUrl: redirectUrl };
    } else {
        // === FIREWALL AUTHENTICATION MODE === (ไม่แตะต้องเลย)
        console.log(`Firewall Authentication successful for user: ${username}.`);
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