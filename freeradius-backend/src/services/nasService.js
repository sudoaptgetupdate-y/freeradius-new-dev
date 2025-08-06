// src/services/nasService.js
const prisma = require('../prisma');
const { exec } = require('child_process');
const os = require('os');

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

  if (os.platform() === 'linux') {
    console.log('Linux platform detected. Attempting to reload FreeRADIUS service...');
    exec('sudo /bin/systemctl reload freeradius.service', (error, stdout, stderr) => {
      if (error) {
        console.error(`EXEC ERROR: Failed to reload FreeRADIUS: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`EXEC STDERR: Error during FreeRADIUS reload: ${stderr}`);
        return;
      }
      console.log(`SUCCESS: FreeRADIUS reloaded successfully. Output: ${stdout}`);
    });
  } else {
    console.log('Non-Linux platform detected (e.g., Windows). Skipping service reload.');
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

    return prisma.nas.update({
        where: { id: parseInt(id, 10) },
        data: dataToUpdate
    });
};

// --- START: ฟังก์ชันที่แก้ไข ---
const deleteNas = async (id) => {
    const nasId = parseInt(id, 10);

    // 1. ค้นหาข้อมูล NAS ที่จะลบเพื่อเอา IP Address (nasname)
    const nasToDelete = await prisma.nas.findUnique({
        where: { id: nasId },
    });

    if (!nasToDelete) {
        throw new Error(`NAS with ID ${nasId} not found.`);
    }

    // 2. ตรวจสอบว่ามี User ที่กำลังออนไลน์ผ่าน NAS นี้หรือไม่
    const onlineUserCount = await prisma.radacct.count({
        where: {
            nasipaddress: nasToDelete.nasname,
            acctstoptime: null, // acctstoptime เป็น null หมายถึงยังออนไลน์อยู่
        },
    });

    // 3. ถ้ามี User ออนไลน์อยู่ ให้โยน Error กลับไป
    if (onlineUserCount > 0) {
        throw new Error(`Cannot delete NAS. There are ${onlineUserCount} user(s) currently online through this NAS.`);
    }

    // 4. ถ้าไม่มี User ออนไลน์ จึงทำการลบ
    return prisma.nas.delete({ where: { id: nasId }});
};
// --- END: ฟังก์ชันที่แก้ไข ---


module.exports = {
  getAllNas,
  createNas,
  getNasById,
  updateNas,
  deleteNas,
};