// src/middlewares/roleMiddleware.js

// ...roles คือ Role ที่เราอนุญาตให้ผ่านได้ เช่น 'superadmin', 'admin'
const authorize = (...roles) => {
  return (req, res, next) => {
    // req.admin มาจาก middleware 'protect' ที่ทำงานก่อนหน้า
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        message: `User role '${req.admin.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { authorize };