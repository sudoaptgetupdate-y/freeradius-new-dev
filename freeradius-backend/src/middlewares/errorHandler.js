// src/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    error: err.message, // แสดงข้อความ error จริงๆ เพื่อช่วย debug
  });
};

module.exports = errorHandler;