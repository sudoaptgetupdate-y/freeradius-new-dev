// src/controllers/registerController.js
const registerService = require('../services/registerService');

const registerUser = async (req, res, next) => {
  try {
    const newUser = await registerService.selfRegisterUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please wait for an administrator to approve your account.',
      data: newUser,
    });
  } catch (error) {
    // ส่งข้อความ Error ที่ Service สร้างขึ้นกลับไปให้ Frontend
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
};