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
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, newFilename);
  }
});

// --- START: แก้ไขส่วนนี้ ---
// 1. กำหนดค่า limits สำหรับขนาดไฟล์
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB
});

// 2. สร้าง Middleware สำหรับจัดการ Error จาก Multer โดยเฉพาะ
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File is too large. The maximum allowed size is 3MB.' });
    }
    return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ success: false, message: `An unknown error occurred during upload: ${err.message}` });
  }
  next();
};
// --- END ---

router.get('/', getAppSettings);
router.post(
  '/',
  protect,
  authorize('superadmin', 'admin'),
  upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'background', maxCount: 1 },
    { name: 'voucherLogo', maxCount: 1 }
  ]),
  handleUploadErrors,
  updateAppSettings
);

module.exports = router;