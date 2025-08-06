// src/services/kickService.js
const prisma = require('../prisma');
const { exec } = require('child_process');
const os = require('os');

/**
 * Executes a shell command and returns a promise.
 * @param {string} command The command to execute.
 * @returns {Promise<string>} A promise that resolves with the stdout of the command.
 */
const executeCommand = (command) => {
  if (os.platform() !== 'linux') {
    console.log(`SKIPPING command on non-linux OS: "${command}"`);
    return Promise.resolve('Kick command simulated on non-Linux OS.');
  }
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });
};

/**
 * Kick a user session by sending a Disconnect-Request packet.
 * @param {object} sessionData - The session data including username, nasipaddress, acctsessionid.
 */
const kickUserSession = async (sessionData) => {
  const { username, nasipaddress, acctsessionid } = sessionData;

  if (!username || !nasipaddress || !acctsessionid) {
    throw new Error('Username, NAS IP, and Session ID are required to kick a user.');
  }

  // 1. ค้นหา Secret ของ NAS (FortiGate) จาก IP Address
  const nas = await prisma.nas.findFirst({
    where: { nasname: nasipaddress },
  });

  if (!nas) {
    throw new Error(`NAS with IP ${nasipaddress} not found.`);
  }

  const nasSecret = nas.secret;
  const disconnectPort = 3799; // Standard port for CoA/Disconnect

  // 2. สร้าง Command สำหรับ radclient
  // เราส่งทั้ง User-Name และ Acct-Session-Id เพื่อระบุ Session ให้แม่นยำที่สุด
  const command = `echo "User-Name=${username},Acct-Session-Id=${acctsessionid}" | radclient -x ${nasipaddress}:${disconnectPort} disconnect ${nasSecret}`;

  console.log(`Executing kick command: ${command}`);

  // 3. รัน Command
  return executeCommand(command);
};

module.exports = {
  kickUserSession,
};