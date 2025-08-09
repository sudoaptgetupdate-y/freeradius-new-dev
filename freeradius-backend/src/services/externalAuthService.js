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
    
    const advertisement = user.organization.advertisement;
    const { password: _, organization, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, advertisement: advertisement };
};

module.exports = {
    loginUser,
};