// freeradius-backend/src/routes/mikrotikProfileRoutes.js
const express = require('express');
const { 
    getProfiles, 
    createProfile, 
    updateProfile, 
    deleteProfile 
} = require('../controllers/mikrotikProfileController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
    .get(getProfiles)
    .post(createProfile);

router.route('/:id')
    .put(updateProfile)
    .delete(deleteProfile);

module.exports = router;