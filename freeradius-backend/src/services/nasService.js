// src/services/nasService.js
const prisma = require('../prisma');
const { exec } = require('child_process');
const os = require('os');

/**
 * Helper function to execute a shell command for reloading FreeRADIUS.
 * This function now returns a Promise.
 */
const reloadFreeradiusService = () => {
  return new Promise((resolve, reject) => {
    if (os.platform() !== 'linux') {
      console.log('[NAS Service] Non-Linux platform detected. Skipping service reload.');
      // หากไม่ใช่ Linux ให้ถือว่าสำเร็จไปเลย
      return resolve('Skipped service reload on non-Linux OS.');
    }

    console.log('[NAS Service] Linux platform detected. Attempting to reload FreeRADIUS service...');
    exec('sudo /bin/systemctl reload freeradius.service', (error, stdout, stderr) => {
      if (error) {
        const errorMessage = `[NAS Service] EXEC ERROR: Failed to reload FreeRADIUS: ${stderr || error.message}`;
        console.error(errorMessage);
        // Reject a promise if there's an error.
        return reject(new Error(errorMessage));
      }
      
      const successMessage = `[NAS Service] SUCCESS: FreeRADIUS reloaded successfully. Output: ${stdout}`;
      console.log(successMessage);
      // Resolve the promise on success.
      resolve(successMessage);
    });
  });
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

  // ใช้ try...catch เพื่อจัดการข้อผิดพลาดจากการ reload
  try {
    await reloadFreeradiusService();
  } catch (reloadError) {
    // โยน Error ต่อไปเพื่อให้ Controller หรือส่วนอื่นๆ จัดการ
    // หรืออาจจะแค่ Log ไว้โดยไม่ขัดขวางการทำงานหลักก็ได้
    console.error('Service reload failed after creating NAS, but the NAS was saved to the database.');
    // throw new Error('NAS created, but failed to reload service.'); // Uncomment if you want to notify the user
  }

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
    
    // ใช้ try...catch เพื่อจัดการข้อผิดพลาดจากการ reload
    try {
        await reloadFreeradiusService();
    } catch (reloadError) {
        console.error('Service reload failed after updating NAS, but the changes were saved to the database.');
        // throw new Error('NAS updated, but failed to reload service.'); // Uncomment if you want to notify the user
    }

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
    
    // ใช้ try...catch เพื่อจัดการข้อผิดพลาดจากการ reload
    try {
        await reloadFreeradiusService();
    } catch (reloadError) {
        console.error('Service reload failed after deleting NAS, but the NAS was removed from the database.');
        // throw new Error('NAS deleted, but failed to reload service.'); // Uncomment if you want to notify the user
    }

    return deletedNas;
};


module.exports = {
  getAllNas,
  createNas,
  getNasById,
  updateNas,
  deleteNas,
};