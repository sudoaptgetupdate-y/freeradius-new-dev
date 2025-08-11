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

  // เพิ่มการตรวจสอบให้แน่ใจว่า framedipaddress ไม่ใช่ค่าว่าง
  if (!username || !nasipaddress || !acctsessionid || !framedipaddress) {
    throw new Error('Username, NAS IP, Session ID, and Framed IP Address are required to kick a user.');
  }

  const nas = await prisma.nas.findFirst({
    where: { nasname: nasipaddress },
  });

  if (!nas) {
    throw new Error(`NAS with IP ${nasipaddress} not found.`);
  }

  const nasSecret = nas.secret;
  const disconnectPort = 3799;
  const stdinData = `User-Name=${username},Acct-Session-Id=${acctsessionid},Framed-IP-Address=${framedipaddress}`;
  const args = [
    '-x',
    `${nasipaddress}:${disconnectPort}`,
    'disconnect',
    nasSecret,
  ];

  console.log(`Attempting to send Disconnect-Request for user ${username} on NAS ${nasipaddress}`);
  // พยายามส่งคำสั่ง kick แต่จะไม่หยุดแม้ว่าจะล้มเหลว (สำหรับ stale session)
  const radclientOutput = await executeCommand('/usr/bin/radclient', args, stdinData);
  console.log(`radclient output: ${radclientOutput}`);

  // ไม่ว่าจะ Kick สำเร็จหรือไม่ ให้ทำการปิด session ในฐานข้อมูลเสมอ
  // เพื่อให้แน่ใจว่า user จะหายไปจากหน้า Online Users
  console.log(`Force-closing session in database for user ${username} (Acct-Session-Id: ${acctsessionid})`);
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

  if (updateResult.count === 0) {
    console.log(`Session for user ${username} was already closed in the database.`);
  }

  return { radclientOutput, dbUpdateResult: updateResult };
};

module.exports = {
  kickUserSession,
};