// src/routes/settingsRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getAppSettings, updateAppSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../public/uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ตั้งค่า Multer สำหรับเก็บไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // --- START: แก้ไขส่วนนี้ ---
  // เปลี่ยนจากการสร้างชื่อไฟล์แบบสุ่ม เป็นการใช้ชื่อไฟล์แบบคงที่
  filename: function (req, file, cb) {
    // file.fieldname จะเป็น 'logo' หรือ 'background'
    // path.extname(file.originalname) จะเป็นนามสกุลไฟล์ เช่น '.png', '.jpg'
    const newFilename = file.fieldname + path.extname(file.originalname);
    cb(null, newFilename);
  }
  // --- END ---
});

const upload = multer({ storage: storage });

// --- (ส่วน Routes คงเดิม) ---
router.get('/', getAppSettings);
router.post(
  '/',
  protect,
  authorize('superadmin'),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'background', maxCount: 1 }]),
  updateAppSettings
);

module.exports = router;