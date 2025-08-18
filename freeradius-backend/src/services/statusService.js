// src/services/statusService.js
const { exec } = require('child_process');
const os = require('os');

/**
 * Executes a shell command and returns a promise.
 * @param {string} command The command to execute.
 * @returns {Promise<string>} A promise that resolves with the stdout of the command.
 */
const executeCommand = (command) => {
  if (os.platform() !== 'linux') {
    // ถ้าไม่ใช่ Linux ให้จำลองการทำงานและ return ค่ากลับไปเลย
    console.log(`SKIPPING command on non-linux OS: "${command}"`);
    if (command.includes('status')) {
      return Promise.resolve('Active: active (running) (development mode)');
    }
    return Promise.resolve('Command simulated on Windows.');
  }
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Return stderr if available, it's often more informative
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });
};

/**
 * Checks the status of the FreeRADIUS service.
 */
const getFreeradiusStatus = async () => {
  try {
    const output = await executeCommand('sudo /bin/systemctl status freeradius.service');
    
    if (output.includes('Active: active (running)')) {
      return { status: 'active', raw: output };
    }
    if (output.includes('Active: inactive (dead)')) {
      return { status: 'inactive', raw: output };
    }
    if (output.includes('Active: failed')) {
        return { status: 'failed', raw: output };
    }
    return { status: 'unknown', raw: output };
  } catch (error) {
    // If systemctl status returns a non-zero exit code, it's often because the service is inactive or failed.
    // We can parse the error output to provide a more accurate status.
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('inactive') || errorMessage.includes('dead')) {
        return { status: 'inactive', raw: error.message };
    }
    if (errorMessage.includes('failed')) {
        return { status: 'failed', raw: error.message };
    }
    // Re-throw if it's an unexpected error
    throw error;
  }
};

/**
 * Restarts the FreeRADIUS service.
 */
const restartFreeradiusService = async () => {
  return executeCommand('sudo /bin/systemctl restart freeradius.service');
};

module.exports = {
  getFreeradiusStatus,
  restartFreeradiusService,
};