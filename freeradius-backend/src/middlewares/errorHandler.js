// src/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'An internal server error occurred';

  // --- ตรวจจับ Error ที่พบบ่อยจาก Prisma ---

  if (err.code === 'P2002') {
    statusCode = 409; // 409 Conflict
    
    // --- START: ส่วนที่แก้ไข ---
    // ตรวจสอบว่า err.meta.target เป็น Array หรือไม่ ก่อนใช้ .join()
    const target = err.meta?.target;
    const field = Array.isArray(target) ? target.join(', ') : target;
    // --- END: สิ้นสุดส่วนที่แก้ไข ---
    
    message = `A record with this ${field} already exists. Please use a different value.`;
  }

  if (err.code === 'P2025') {
    statusCode = 404; // 404 Not Found
    message = `Operation failed because the requested record was not found. It may have already been deleted.`;
  }

  // --- ตรวจจับ Error ทั่วไปจาก Service ที่เราสร้างขึ้นเอง ---

  if (err.message.toLowerCase().includes('not found')) {
    statusCode = 404;
  }
  if (
    err.message.toLowerCase().includes('required') || 
    err.message.toLowerCase().includes('invalid') ||
    err.message.toLowerCase().includes('must be empty') ||
    err.message.toLowerCase().includes('cannot be changed')
  ) {
    statusCode = 400; // 400 Bad Request
  }
  if (err.message.toLowerCase().includes('cannot delete') || err.message.toLowerCase().includes('not authorized')) {
    statusCode = 403; // 403 Forbidden
  }

  // --- สร้าง Response สุดท้าย ---
  const errorResponse = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.errorDetails = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;