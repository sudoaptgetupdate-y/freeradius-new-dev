// src/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
  // Log error ลงใน console ของ Server ไว้เสมอเพื่อการตรวจสอบย้อนหลัง
  console.error(err);

  let statusCode = err.statusCode || 500; // ถ้ามี statusCode ใน error ให้ใช้ค่านั้น, ถ้าไม่ ให้ใช้ 500
  let message = err.message || 'An internal server error occurred';

  // --- ตรวจจับ Error ที่พบบ่อยจาก Prisma ---

  // P2002: Unique constraint failed (มีข้อมูลซ้ำใน Field ที่ต้องไม่ซ้ำ)
  if (err.code === 'P2002') {
    statusCode = 409; // 409 Conflict
    // err.meta.target จะบอกว่า field ไหนที่ซ้ำ
    const field = err.meta?.target?.join(', ');
    message = `A record with this ${field} already exists. Please use a different value.`;
  }

  // P2025: Record ที่จะลบหรืออัปเดตหาไม่เจอ
  if (err.code === 'P2025') {
    statusCode = 404; // 404 Not Found
    message = `Operation failed because the requested record was not found. It may have already been deleted.`;
  }

  // --- ตรวจจับ Error ทั่วไปจาก Service ที่เราสร้างขึ้นเอง ---

  // เช็คจาก Keyword ใน message เพื่อกำหนด statusCode ที่เหมาะสม
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
    message, // ใช้ message ที่เราประมวลผลแล้ว
  };

  // ในโหมด Development ให้ส่ง stack trace กลับไปด้วยเพื่อช่วย Debug
  // ในโหมด Production จะไม่ส่งเพื่อความปลอดภัย
  if (process.env.NODE_ENV === 'development') {
    errorResponse.errorDetails = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;