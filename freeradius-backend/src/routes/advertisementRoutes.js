// src/routes/advertisementRoutes.js
const express = require('express');
const {
  getAllAds,
  createAd,
  updateAd,
  deleteAd,
} = require('../controllers/advertisementController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ป้องกันทุก Route และให้ Admin ขึ้นไปจัดการได้
router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
  .get(getAllAds)
  .post(createAd);

router.route('/:id')
  .put(updateAd)
  .delete(deleteAd);

module.exports = router;