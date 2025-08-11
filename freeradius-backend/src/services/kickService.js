// src/services/kickService.js
const prisma = require('../prisma');
const { execFile } = require('child_process');
const os = require('os');

/**
 * Executes a shell command securely and returns a promise.
 * @param {string} command The command to execute.
 * @param {string[]} args The arguments for the command.
 * @param {string} stdinData The data to pipe to the command's stdin.
 * @returns {Promise<string>} A promise that resolves with the stdout of the command.
 */
const executeCommand = (command, args, stdinData) => {
  if (os.platform() !== 'linux') {
    console.log(`SKIPPING command on non-linux OS: "${command} ${args.join(' ')}"`);
    return Promise.resolve('Kick command simulated on non-Linux OS.');
  }

  return new Promise((resolve, reject) => {
    const child = execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        // We don't reject here anymore, as failure is expected for stale sessions.
        // We resolve with the error message to allow the caller to log it.
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

/**
 * Kicks a user session by sending a Disconnect-Request and force-closing the session in the database.
 * This handles both active and stale sessions.
 * @param {object} sessionData - The session data including username, nasipaddress, acctsessionid.
 */
const kickUserSession = async (sessionData) => {
  const { username, nasipaddress, acctsessionid } = sessionData;

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
  const stdinData = `User-Name=${username},Acct-Session-Id=${acctsessionid}`;
  const args = [
    '-x',
    `${nasipaddress}:${disconnectPort}`,
    'disconnect',
    nasSecret,
  ];

  console.log(`Attempting to send Disconnect-Request for user ${username} on NAS ${nasipaddress}`);
  // We try to kick the user but don't stop if it fails (e.g., stale session)
  const radclientOutput = await executeCommand('/usr/bin/radclient', args, stdinData);
  console.log(`radclient output: ${radclientOutput}`);

  // Regardless of the kick result, we force-close the session in the database.
  console.log(`Force-closing session in database for user ${username} (Acct-Session-Id: ${acctsessionid})`);
  const updateResult = await prisma.radacct.updateMany({
    where: {
      acctsessionid: acctsessionid,
      username: username,
      acctstoptime: null, // Only update sessions that are currently marked as online
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