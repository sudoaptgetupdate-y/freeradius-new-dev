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
    // --- START: เพิ่ม Logic การตั้งชื่อไฟล์ ---
    // file.fieldname จะเป็น 'logo', 'background', หรือ 'voucherLogo'
    // เราจะตั้งชื่อไฟล์ตาม fieldname เพื่อป้องกันการเขียนทับกัน
    const newFilename = file.fieldname + path.extname(file.originalname);
    cb(null, newFilename);
    // --- END ---
  }
});

const upload = multer({ storage: storage });

router.get('/', getAppSettings);
router.post(
  '/',
  protect,
  authorize('superadmin'),
  // --- START: เพิ่ม field 'voucherLogo' ---
  upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'background', maxCount: 1 },
    { name: 'voucherLogo', maxCount: 1 } // <-- เพิ่ม field สำหรับโลโก้บัตร
  ]),
  // --- END ---
  updateAppSettings
);

module.exports = router;