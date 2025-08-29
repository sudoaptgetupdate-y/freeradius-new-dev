// src/services/registerService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const selfRegisterUser = async (userData) => {
  // --- START: MODIFIED ---
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['registrationEnabled', 'initialUserStatus'] } },
  });
  
  const registrationSetting = settings.find(s => s.key === 'registrationEnabled');
  const initialUserStatusSetting = settings.find(s => s.key === 'initialUserStatus');

  if (registrationSetting?.value !== 'true') {
    throw new Error('User self-registration is currently disabled by the administrator.');
  }

  const initialStatus = initialUserStatusSetting?.value || 'registered'; // Default to 'registered' if not set
  // --- END ---

  const { fullName, username, email, phoneNumber, password } = userData;

  if (!fullName || !username || !email || !phoneNumber || !password) {
    throw new Error('All fields are required.');
  }

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
  
  const existingUser = await prisma.user.findFirst({
    where: {
        OR: [
            { username: username },
            { email: email }
        ]
    }
  });

  if (existingUser) {
    if (existingUser.username === username) {
        throw new Error('This username is already taken.');
    }
    if (existingUser.email === email) {
        throw new Error('This email has already been registered.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const profile_name = registerOrg.radiusProfile.name;

  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        organizationId: registerOrg.id,
        username: username,
        password: hashedPassword,
        full_name: fullName,
        email: email,
        phoneNumber: phoneNumber,
        status: initialStatus, // <-- USE THE NEW SETTING
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
    
    // If the initial status is 'active', don't add the 'Reject' rule.
    // For any other status ('registered', 'disabled'), add it to prevent login until approved.
    if (initialStatus !== 'active') {
        await tx.radcheck.create({
            data: {
                username: username,
                attribute: 'Auth-Type',
                op: ':=',
                value: 'Reject',
            },
        });
    }

    const { password: _, ...safeUserData } = newUser;
    return safeUserData;
  });
};

module.exports = {
  selfRegisterUser,
};