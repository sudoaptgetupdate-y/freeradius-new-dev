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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // --- 👇 แก้ไขฟังก์ชัน filename ตรงนี้ ---
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกันโดยใช้ timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, newFilename);
  }
  // --- 👆 สิ้นสุดส่วนที่แก้ไข ---
});

const upload = multer({ storage: storage });

router.get('/', getAppSettings);
router.post(
  '/',
  protect,
  authorize('superadmin'),
  upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'background', maxCount: 1 },
    { name: 'voucherLogo', maxCount: 1 }
  ]),
  updateAppSettings
);

module.exports = router;