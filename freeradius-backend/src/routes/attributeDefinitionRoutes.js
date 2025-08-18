// src/routes/attributeDefinitionRoutes.js
const express = require('express');
const {
    getAllDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinition
} = require('../controllers/attributeDefinitionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin', 'admin')); // ให้ทั้ง admin และ superadmin จัดการได้

router.route('/')
    .get(getAllDefinitions)
    .post(createDefinition);

router.route('/:id')
    .put(updateDefinition)
    .delete(deleteDefinition);

module.exports = router;