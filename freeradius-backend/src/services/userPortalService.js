// src/services/userPortalService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { kickUserSession } = require('./kickService');

const login = async (username, password) => {
    if (!username || !password) {
        throw new Error('Please provide username and password');
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Incorrect username or password');
    }
    if (user.status !== 'active') {
        throw new Error('Your account is currently disabled. Please contact an administrator.');
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
};

const getMyProfile = async (userId) => {
    const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
            phoneNumber: true,
            organization: { select: { name: true } }
        }
    });

    if (!userProfile) {
        throw new Error('User not found.');
    }

    // ค้นหา Session ที่กำลังออนไลน์อยู่
    const currentSession = await prisma.radacct.findFirst({
        where: {
            username: userProfile.username,
            acctstoptime: null
        },
        orderBy: {
            acctstarttime: 'desc'
        }
    });

    // ค้นหาวันหมดอายุจาก radcheck
    const expirationAttr = await prisma.radcheck.findFirst({
        where: {
            username: userProfile.username,
            attribute: 'Expiration'
        }
    });
    
    return {
        ...userProfile,
        expirationDate: expirationAttr ? expirationAttr.value : null,
        currentSession: currentSession ? {
            ip: currentSession.framedipaddress,
            mac: currentSession.callingstationid,
            nas: currentSession.nasipaddress,
            loginTime: currentSession.acctstarttime,
            dataUp: currentSession.acctoutputoctets?.toString() || '0',
            dataDown: currentSession.acctinputoctets?.toString() || '0',
        } : null
    };
};

const updateMyProfile = async (userId, data) => {
    const { full_name, email, phoneNumber } = data;
    return prisma.user.update({
        where: { id: userId },
        data: { full_name, email, phoneNumber }
    });
};

const changeMyPassword = async (userId, oldPassword, newPassword) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found.");

    // 1. ตรวจสอบรหัสผ่านเก่า
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error("Your old password is not correct.");

    // 2. เข้ารหัสผ่านใหม่
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 3. อัปเดตข้อมูลใน Transaction เดียวกัน
    return prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        }),
        prisma.radcheck.update({
            where: { 
                // ใช้ unique identifier ที่เราสร้างไว้ใน schema
                username_attribute: { 
                    username: user.username, 
                    attribute: 'Crypt-Password' 
                } 
            },
            data: { value: hashedNewPassword }
        })
    ]);
};

const clearMySessions = async (username) => {
    const onlineSessions = await prisma.radacct.findMany({
        where: {
            username: username,
            acctstoptime: null
        },
        select: {
            username: true,
            nasipaddress: true,
            acctsessionid: true,
            framedipaddress: true
        }
    });

    if (onlineSessions.length === 0) {
        return { cleared: 0, message: "No active sessions found to clear." };
    }

    let successCount = 0;
    for (const session of onlineSessions) {
        // ไม่ต้องใช้ try...catch แล้ว เพราะ kickUserSession จะไม่ throw error
        const result = await kickUserSession({
            username: session.username,
            nasipaddress: session.nasipaddress,
            acctsessionid: session.acctsessionid,
            framedipaddress: session.framedipaddress,
        });
        if (result.success) {
            successCount++;
        }
    }
    return { cleared: onlineSessions.length, message: `Successfully disconnected ${onlineSessions.length} session(s).` };
};

module.exports = {
    login,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
    clearMySessions,
};