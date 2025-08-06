// freeradius-backend/src/controllers/userController.js

const userService = require('../services/userService');

const createUser = async (req, res, next) => {
  try {
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({ message: 'Unauthorized: Admin ID not found.' });
    }
    const adminId = req.admin.id;

    const result = await userService.createUserAndSync(req.body, adminId);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.newUser,
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const usersData = await userService.getAllUsers(req.query);
    res.status(200).json({ success: true, data: usersData });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await userService.getUserByUsername(username);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    await userService.deleteUserByUsername(username);
    res.status(200).json({
      success: true,
      message: `User '${username}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const updateData = req.body;
    const result = await userService.updateUserByUsername(username, updateData);
    res.status(200).json({
      success: true,
      message: `User '${username}' updated successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// --- START: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---
const moveUsersToOrganization = async (req, res, next) => {
    try {
        const { userIds, targetOrganizationId } = req.body;
        const result = await userService.moveUsersToNewOrganization(userIds, targetOrganizationId);
        res.status(200).json({ success: true, message: `${result.movedCount} user(s) moved successfully.`, data: result });
    } catch (error) {
        // ส่งข้อความ Error ที่เราสร้างไว้ใน Service กลับไป
        res.status(400).json({ success: false, message: error.message });
    }
};
// --- END: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---


module.exports = {
  createUser,
  getUsers,
  getUser,
  deleteUser,
  updateUser,
  moveUsersToOrganization, // <-- Export ฟังก์ชันใหม่
};