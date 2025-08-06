const prisma = require('../prisma');
const bcrypt = require('bcrypt');

const createAdmin = async (adminData) => {
  // --- แก้ไขตรงนี้: เพิ่ม fullName, email, phoneNumber เข้ามา ---
  const { username, password, role, fullName, email, phoneNumber } = adminData;

  // ตรวจสอบว่ามี password ส่งมาหรือไม่
  if (!password) {
    throw new Error('Password is required');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.Administrator.create({
    data: {
      username,
      password: hashedPassword,
      role,
      // --- เพิ่ม field ใหม่ๆ เข้าไปใน object ที่จะสร้าง ---
      fullName,
      email,
      phoneNumber,
    },
  });
};

const getAllAdmins = async () => {
  return prisma.Administrator.findMany();
};

const getAdminById = async (adminId) => {
    return prisma.Administrator.findUnique({ where: { id: parseInt(adminId, 10) } });
};

const updateAdmin = async (adminId, updateData) => {
    const { password, ...otherData } = updateData;

    const dataToUpdate = { ...otherData };

    if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    
    return prisma.Administrator.update({
        where: { id: parseInt(adminId, 10) },
        data: dataToUpdate,
    });
};


const deleteAdmin = async (adminId) => {
    return prisma.Administrator.delete({ where: { id: parseInt(adminId, 10) }});
};


module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};