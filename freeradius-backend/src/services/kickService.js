// src/services/kickService.js
const prisma = require('../prisma');
const { execFile } = require('child_process');
const os = require('os');

const executeCommand = (command, args, stdinData) => {
  if (os.platform() !== 'linux') {
    console.log(`SKIPPING command on non-linux OS: "${command} ${args.join(' ')}"`);
    return Promise.resolve('Kick command simulated on non-Linux OS.');
  }

  return new Promise((resolve) => {
    const child = execFile(command, args, (error, stdout, stderr) => {
      // ไม่ว่าคำสั่งจะสำเร็จหรือไม่ ให้ resolve ค่ากลับไปเสมอ
      // เพื่อให้ฟังก์ชันหลักทำงานต่อได้ (จัดการ stale session)
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
  const { username, nasipaddress, acctsessionid, framedipaddress } = sessionData;

  if (!username || !nasipaddress || !acctsessionid || !framedipaddress) {
    throw new Error('Internal Error: Missing required data for kickUserSession.');
  }

  const nas = await prisma.nas.findFirst({ where: { nasname: nasipaddress } });
  if (!nas) {
    console.error(`Kick failed: NAS with IP ${nasipaddress} not found in DB.`);
    return { success: false, reason: 'NAS not found' };
  }

  const nasSecret = nas.secret;
  const disconnectPort = 3799;
  const stdinData = `User-Name=${username},Acct-Session-Id=${acctsessionid},Framed-IP-Address=${framedipaddress}`;
  const args = [ '-x', `${nasipaddress}:${disconnectPort}`, 'disconnect', nasSecret ];

  console.log(`Attempting to send Disconnect-Request for user ${username}`);
  const radclientOutput = await executeCommand('/usr/bin/radclient', args, stdinData);
  console.log(`radclient output: ${radclientOutput}`);

  // บังคับปิด Session ใน DB เสมอ เพื่อความสะอาดของ UI
  await prisma.radacct.updateMany({
    where: { acctsessionid: acctsessionid, username: username, acctstoptime: null },
    data: { acctstoptime: new Date(), acctterminatecause: 'Admin-Disconnect' },
  });

  if (radclientOutput.includes('Disconnect-ACK')) {
    return { success: true, reason: 'ACK' };
  } else {
    // ไม่ throw error แล้ว แต่คืนค่าสถานะล้มเหลว
    return { success: false, reason: 'NAK or Timeout' };
  }
};

module.exports = {
  kickUserSession,
};