// src/services/nasService.js
const prisma = require('../prisma');
const { exec } = require('child_process');
const os = require('os');

/**
 * Helper function to execute a shell command for reloading FreeRADIUS.
 */
const reloadFreeradiusService = () => {
  if (os.platform() === 'linux') {
    console.log('[NAS Service] Linux platform detected. Attempting to reload FreeRADIUS service...');
    exec('sudo /bin/systemctl reload freeradius.service', (error, stdout, stderr) => {
      if (error) {
        console.error(`[NAS Service] EXEC ERROR: Failed to reload FreeRADIUS: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[NAS Service] EXEC STDERR: Error during FreeRADIUS reload: ${stderr}`);
        return;
      }
      console.log(`[NAS Service] SUCCESS: FreeRADIUS reloaded successfully. Output: ${stdout}`);
    });
  } else {
    console.log('[NAS Service] Non-Linux platform detected. Skipping service reload.');
  }
};

const getAllNas = async () => {
  return prisma.nas.findMany({
    orderBy: {
      nasname: 'asc',
    },
  });
};

const createNas = async (nasData) => {
  const { nasname, shortname, secret, description, type } = nasData;
  if (!nasname || !secret) {
    throw new Error('NAS Name (IP/Hostname) and Secret are required.');
  }

  const newNas = await prisma.nas.create({
    data: {
      nasname,
      shortname,
      secret,
      description,
      type: type || 'other',
    },
  });

  reloadFreeradiusService(); // เรียกใช้ Helper function

  return newNas;
};

const getNasById = async (id) => {
    return prisma.nas.findUnique({ where: { id: parseInt(id, 10) } });
};

const updateNas = async (id, nasData) => {
    const { nasname, shortname, secret, description, type } = nasData;
    const dataToUpdate = { nasname, shortname, description, type };

    if (secret) {
        dataToUpdate.secret = secret;
    }

    const updatedNas = await prisma.nas.update({
        where: { id: parseInt(id, 10) },
        data: dataToUpdate
    });

    reloadFreeradiusService(); // เรียกใช้ Helper function

    return updatedNas;
};

const deleteNas = async (id) => {
    const nasId = parseInt(id, 10);

    const nasToDelete = await prisma.nas.findUnique({
        where: { id: nasId },
    });

    if (!nasToDelete) {
        throw new Error(`NAS with ID ${nasId} not found.`);
    }

    const onlineUserCount = await prisma.radacct.count({
        where: {
            nasipaddress: nasToDelete.nasname,
            acctstoptime: null,
        },
    });

    if (onlineUserCount > 0) {
        throw new Error(`Cannot delete NAS. There are ${onlineUserCount} user(s) currently online through this NAS.`);
    }

    const deletedNas = await prisma.nas.delete({ where: { id: nasId }});
    
    reloadFreeradiusService(); // เรียกใช้ Helper function หลังลบสำเร็จ

    return deletedNas;
};


module.exports = {
  getAllNas,
  createNas,
  getNasById,
  updateNas,
  deleteNas,
};