// src/services/registerService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const selfRegisterUser = async (userData) => {
  const { fullName, username, nationalId, password } = userData;

  // 1. ตรวจสอบข้อมูลเบื้องต้น
  if (!fullName || !username || !nationalId || !password) {
    throw new Error('All fields are required.');
  }

  // 2. ค้นหาองค์กร "Register"
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
  
  // 3. ตรวจสอบ Username และ National ID ซ้ำ
  const existingUser = await prisma.user.findFirst({
    where: {
        OR: [
            { username: username },
            { national_id: nationalId }
        ]
    }
  });

  if (existingUser) {
    if (existingUser.username === username) {
        throw new Error('This username is already taken.');
    }
    if (existingUser.national_id === nationalId) {
        throw new Error('This National ID has already been registered.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const profile_name = registerOrg.radiusProfile.name;

  // 4. สร้างผู้ใช้ใน Transaction เพื่อความปลอดภัยของข้อมูล
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        organizationId: registerOrg.id,
        username: username,
        password: hashedPassword,
        full_name: fullName,
        national_id: nationalId,
        status: 'inactive', // <-- ตั้งค่าสถานะเริ่มต้นเป็น inactive
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

    // ไม่ส่งรหัสผ่านกลับไป
    const { password: _, ...safeUserData } = newUser;
    return safeUserData;
  });
};

module.exports = {
  selfRegisterUser,
};