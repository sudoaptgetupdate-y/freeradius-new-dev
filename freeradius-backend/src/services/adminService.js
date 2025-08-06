const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const createAdmin = async (adminData) => {
  const { username, password, role, fullName, email, phoneNumber } = adminData;

  if (!password) {
    throw new Error('Password is required');
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.Administrator.create({
    data: {
      username,
      password: hashedPassword,
      role,
      fullName,
      email,
      phoneNumber,
    },
  });
};

const getAllAdmins = async () => {
  return prisma.Administrator.findMany({
    select: { // ไม่ส่งรหัสผ่านกลับไป
      id: true,
      username: true,
      role: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      status: true,
      createdAt: true
    }
  });
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

const deleteAdmin = async (adminIdToDelete, currentAdminId) => {
    if (adminIdToDelete === currentAdminId) {
        throw new Error("You cannot delete your own account.");
    }
    return prisma.Administrator.delete({ where: { id: adminIdToDelete }});
};

// --- START: ฟังก์ชันใหม่ ---
const toggleAdminStatus = async (adminIdToToggle, currentAdminId) => {
    if (adminIdToToggle === currentAdminId) {
        throw new Error("You cannot change the status of your own account.");
    }
    const admin = await prisma.Administrator.findUnique({ where: { id: adminIdToToggle }});
    if (!admin) {
        throw new Error("Admin not found.");
    }
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    return prisma.Administrator.update({
        where: { id: adminIdToToggle },
        data: { status: newStatus }
    });
};
// --- END: ฟังก์ชันใหม่ ---

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus // <-- Export ฟังก์ชันใหม่
};