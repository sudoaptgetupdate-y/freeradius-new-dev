// src/services/registerService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const selfRegisterUser = async (userData) => {
  // --- โค้ดตรวจสอบสถานะ ---
  const registrationSetting = await prisma.setting.findUnique({
    where: { key: 'registrationEnabled' }
  });
  // ถ้าค่าเป็น 'false' ให้โยน Error ทันที
  if (registrationSetting?.value !== 'true') {
    throw new Error('User self-registration is currently disabled by the administrator.');
  }
  // 1. รับค่า email และ phoneNumber เข้ามาแทน nationalId
  const { fullName, username, email, phoneNumber, password } = userData;

  // 2. ตรวจสอบข้อมูลใหม่ทั้งหมด
  if (!fullName || !username || !email || !phoneNumber || !password) {
    throw new Error('All fields are required.');
  }
  // --- END ---

  // 3. ค้นหาองค์กร "Register" (ยังคงเดิม)
  const registerOrg = await prisma.organization.findUnique({
    where: { name: 'Register' },
    include: { radiusProfile: true },
  });

  if (!registerOrg) {
    throw new Error('Registration system is not configured. Please contact an administrator.');
  }
  if (!registerOrg.radiusProfile) {
    throw new Error('Registration profile is not configured. Please contact an administrator.');
  }
  
  // 4. ตรวจสอบ Username และ Email ซ้ำ (ปรับปรุง)
  const existingUser = await prisma.user.findFirst({
    where: {
        OR: [
            { username: username },
            { email: email } // <-- ตรวจสอบ Email ซ้ำด้วย
        ]
    }
  });

  if (existingUser) {
    if (existingUser.username === username) {
        throw new Error('This username is already taken.');
    }
    if (existingUser.email === email) { // <-- เพิ่มเงื่อนไขตรวจสอบ Email
        throw new Error('This email has already been registered.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const profile_name = registerOrg.radiusProfile.name;

  // 5. สร้างผู้ใช้ใน Transaction (เพิ่ม email, phoneNumber และลบ nationalId)
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        organizationId: registerOrg.id,
        username: username,
        password: hashedPassword,
        full_name: fullName,
        email: email,             // <-- เพิ่ม
        phoneNumber: phoneNumber, // <-- เพิ่ม
        status: 'disabled', // <--- ❗️❗️❗️ แก้ไขจาก 'inactive' เป็น 'disabled' ❗️❗️❗️
      },
    });

    await tx.radcheck.create({
      data: {
        username: username,
        attribute: 'Crypt-Password',
        op: ':=',
        value: hashedPassword,
      },
    });

    await tx.radusergroup.create({
      data: {
        username: username,
        groupname: profile_name,
        priority: 10,
      },
    });

    const { password: _, ...safeUserData } = newUser;
    return safeUserData;
  });
};

module.exports = {
  selfRegisterUser,
};