// src/routes/organizationRoutes.js
const express = require('express');
const { 
    createNewOrganization, 
    getAllOrgs,
    getOrgById,
    updateOrg,
    deleteOrg // <-- Import เข้ามา
} = require('../controllers/organizationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.post('/', createNewOrganization);
router.get('/', getAllOrgs);
router.get('/:id', getOrgById);
router.put('/:id', updateOrg);
router.delete('/:id', deleteOrg); // <-- เพิ่ม Route ใหม่

module.exports = router;