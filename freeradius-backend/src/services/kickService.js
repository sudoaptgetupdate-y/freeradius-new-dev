// src/services/kickService.js
const prisma = require('../prisma');
const { execFile } = require('child_process'); // 1. เปลี่ยนมาใช้ execFile
const os = require('os');

/**
 * Executes a shell command securely and returns a promise.
 * @param {string} command The command to execute.
 * @param {string[]} args The arguments for the command.
 * @param {string} stdinData The data to pipe to the command's stdin.
 * @returns {Promise<string>} A promise that resolves with the stdout of the command.
 */
const executeCommand = (command, args, stdinData) => {
  // ยังคงจำลองการทำงานบน OS อื่นที่ไม่ใช่ Linux
  if (os.platform() !== 'linux') {
    console.log(`SKIPPING command on non-linux OS: "${command} ${args.join(' ')}"`);
    return Promise.resolve('Kick command simulated on non-Linux OS.');
  }

  // 2. เปลี่ยนมาใช้ execFile ซึ่งปลอดภัยกว่า
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });

    // 3. ส่งข้อมูล user ผ่าน stdin แทนการต่อ string ใน command
    if (stdinData) {
      child.stdin.write(stdinData);
      child.stdin.end();
    }
  });
};

/**
 * Kick a user session by sending a Disconnect-Request packet.
 * @param {object} sessionData - The session data including username, nasipaddress, acctsessionid.
 */
const kickUserSession = async (sessionData) => {
  const { username, nasipaddress, acctsessionid } = sessionData;

  // 4. เพิ่มการตรวจสอบ Input เบื้องต้น เพื่อป้องกันอักขระแปลกปลอม
  if (!/^[a-zA-Z0-9._-]+$/.test(username) || 
      !/^[a-zA-Z0-9:.-]+$/.test(nasipaddress) || 
      !/^[a-zA-Z0-9]+$/.test(acctsessionid)) {
      throw new Error('Invalid characters detected in session data.');
  }

  if (!username || !nasipaddress || !acctsessionid) {
    throw new Error('Username, NAS IP, and Session ID are required to kick a user.');
  }

  const nas = await prisma.nas.findFirst({
    where: { nasname: nasipaddress },
  });

  if (!nas) {
    throw new Error(`NAS with IP ${nasipaddress} not found.`);
  }

  const nasSecret = nas.secret;
  const disconnectPort = 3799;

  // 5. เตรียมข้อมูลที่จะส่งผ่าน stdin
  const stdinData = `User-Name=${username},Acct-Session-Id=${acctsessionid}`;
  
  // 6. เตรียม arguments แยกเป็นอาร์เรย์
  const args = [
    '-x',
    `${nasipaddress}:${disconnectPort}`,
    'disconnect',
    nasSecret,
  ];

  console.log(`Executing kick command: /usr/bin/radclient with args: [${args.join(', ')}]`);

  // 7. รันคำสั่งอย่างปลอดภัยโดยแยกระหว่าง "คำสั่ง", "arguments", และ "ข้อมูล"
  return executeCommand('/usr/bin/radclient', args, stdinData);
};

module.exports = {
  kickUserSession,
};