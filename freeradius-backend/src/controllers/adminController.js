// src/controllers/adminController.js
const adminService = require('../services/adminService');

const createNewAdmin = async (req, res, next) => {
  try {
    const newAdmin = await adminService.createAdmin(req.body);
    res.status(201).json({ success: true, data: newAdmin });
  } catch (error) {
    next(error);
  }
};

const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await adminService.getAllAdmins();
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
};

const deleteAdminById = async (req, res, next) => {
    try {
        const adminId = parseInt(req.params.id);
        await adminService.deleteAdmin(adminId);
        res.status(200).json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        next(error);
    }
}

const getAdmin = async (req, res, next) => {
    try {
        const adminId = parseInt(req.params.id);
        const admin = await adminService.getAdminById(adminId);
        res.status(200).json({ success: true, data: admin });
    } catch (error) {
        next(error);
    }
};

const updateAdmin = async (req, res, next) => {
    try {
        // --- START: เพิ่มโค้ดตรวจสอบสิทธิ์ ---
        const adminIdToUpdate = parseInt(req.params.id);
        const requestingAdminId = req.admin.id; // ID ของผู้ใช้ที่ส่ง request มา
        const requestingAdminRole = req.admin.role; // Role ของผู้ใช้ที่ส่ง request มา

        // ถ้าผู้ใช้เป็น 'admin' และพยายามแก้ไข ID ที่ไม่ใช่ของตัวเอง ให้ปฏิเสธ
        if (requestingAdminRole === 'admin' && requestingAdminId !== adminIdToUpdate) {
            return res.status(403).json({ success: false, message: 'Admins can only update their own profile.' });
        }
        // --- END ---

        const updatedAdmin = await adminService.updateAdmin(adminIdToUpdate, req.body);
        res.status(200).json({ success: true, data: updatedAdmin });
    } catch (error) {
        next(error);
    }
};

const toggleStatus = async (req, res, next) => {
    try {
        const adminIdToToggle = parseInt(req.params.id);
        const currentAdminId = req.admin.id;
        const updatedAdmin = await adminService.toggleAdminStatus(adminIdToToggle, currentAdminId);
        res.status(200).json({ success: true, message: `Admin status updated to ${updatedAdmin.status}` });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
  createNewAdmin,
  getAllAdmins,
  deleteAdminById,
  getAdmin,
  updateAdmin,
  toggleStatus,
};