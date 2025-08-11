// src/services/kickService.js
const prisma = require('../prisma');
const { execFile } = require('child_process');
const os = require('os');

const executeCommand = (command, args, stdinData) => {
  if (os.platform() !== 'linux') {
    console.log(`SKIPPING command on non-linux OS: "${command} ${args.join(' ')}"`);
    return Promise.resolve('Kick command simulated on non-Linux OS.');
  }

  return new Promise((resolve, reject) => {
    const child = execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        resolve(stderr || error.message);
        return;
      }
      resolve(stdout);
    });

    if (stdinData) {
      child.stdin.write(stdinData);
      child.stdin.end();
    }
  });
};

const kickUserSession = async (sessionData) => {
  // --- START: แก้ไขส่วนนี้ ---
  const { username, nasipaddress, acctsessionid, framedipaddress } = sessionData;

  if (!/^[a-zA-Z0-9._-]+$/.test(username) || 
      !/^[a-zA-Z0-9:.-]+$/.test(nasipaddress) || 
      !/^[a-zA-Z0-9]+$/.test(acctsessionid) ||
      !/^[a-zA-Z0-9:.-]+$/.test(framedipaddress) // เพิ่มการตรวจสอบ
    ) {
      throw new Error('Invalid characters detected in session data.');
  }

  if (!username || !nasipaddress || !acctsessionid || !framedipaddress) {
    throw new Error('Username, NAS IP, Session ID, and Framed IP Address are required to kick a user.');
  }
  // --- END ---

  const nas = await prisma.nas.findFirst({
    where: { nasname: nasipaddress },
  });

  if (!nas) {
    throw new Error(`NAS with IP ${nasipaddress} not found.`);
  }

  const nasSecret = nas.secret;
  const disconnectPort = 3799;
  
  // --- START: แก้ไขส่วนนี้ ---
  // เพิ่ม Framed-IP-Address เข้าไปในข้อมูลที่จะส่ง
  const stdinData = `User-Name=${username},Acct-Session-Id=${acctsessionid},Framed-IP-Address=${framedipaddress}`;
  // --- END ---

  const args = [
    '-x',
    `${nasipaddress}:${disconnectPort}`,
    'disconnect',
    nasSecret,
  ];

  console.log(`Attempting to send Disconnect-Request for user ${username} on NAS ${nasipaddress}`);
  const radclientOutput = await executeCommand('/usr/bin/radclient', args, stdinData);
  console.log(`radclient output: ${radclientOutput}`);

  // ถ้าได้รับ ACK (สำเร็จ) ให้บังคับปิด session ใน DB เพื่อให้ UI อัปเดตทันที
  if (radclientOutput.includes('Disconnect-ACK')) {
      console.log(`Force-closing session in database for user ${username} after successful ACK.`);
      const updateResult = await prisma.radacct.updateMany({
        where: {
          acctsessionid: acctsessionid,
          username: username,
          acctstoptime: null,
        },
        data: {
          acctstoptime: new Date(),
          acctterminatecause: 'Admin-Disconnect',
        },
      });
      return { radclientOutput, dbUpdateResult: updateResult };
  } else {
      // ถ้าล้มเหลว (NAK) ให้โยน Error เพื่อให้ Frontend แสดงข้อความแจ้งเตือน
      throw new Error(`Failed to kick user. NAS responded: ${radclientOutput}`);
  }
};

module.exports = {
  kickUserSession,
};