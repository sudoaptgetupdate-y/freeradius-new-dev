// src/controllers/historyController.js
const historyService = require('../services/historyService');

// --- เพิ่มฟังก์ชันนี้เข้าไปที่ด้านบนของไฟล์ ---
// ฟังก์ชันนี้จะถูกใช้โดย JSON.stringify เพื่อแปลง BigInt เป็น String
const jsonReplacer = (key, value) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};
// ------------------------------------------

const getHistory = async (req, res, next) => {
  try {
    const historyData = await historyService.getAccountingHistory(req.query);
    
    // --- แก้ไขวิธีการส่ง JSON กลับไป ---
    // เราจะแปลง Object เป็น String ด้วยตัวเองโดยใช้ replacer ที่เราสร้าง
    const jsonString = JSON.stringify({ success: true, data: historyData }, jsonReplacer);
    
    // จากนั้นจึงส่ง String นั้นกลับไป
    res.set('Content-Type', 'application/json').status(200).send(jsonString);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,
};