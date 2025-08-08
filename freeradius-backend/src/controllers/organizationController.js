// src/controllers/organizationController.js
const organizationService = require('../services/organizationService');

const createNewOrganization = async (req, res, next) => {
  try {
    const newOrg = await organizationService.createOrganization(req.body);
    res.status(201).json({ success: true, data: newOrg });
  } catch (error) {
    next(error);
  }
};

const getAllOrgs = async (req, res, next) => {
  try {
    const orgs = await organizationService.getAllOrganizations(req.query);
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    next(error);
  }
};

const getOrgById = async (req, res, next) => {
  try {
    const org = await organizationService.getOrganizationById(req.params.id);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

const updateOrg = async (req, res, next) => {
  try {
    const updatedOrg = await organizationService.updateOrganization(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedOrg });
  } catch (error) {
    // ส่งข้อผิดพลาดกลับไปให้ Frontend โดยตรง
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteOrg = async (req, res, next) => {
    try {
        await organizationService.deleteOrganization(req.params.id);
        res.status(200).json({ success: true, message: 'Organization deleted successfully'});
    } catch (error) {
        // ส่งข้อผิดพลาดกลับไปให้ Frontend โดยตรง
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
  createNewOrganization,
  getAllOrgs,
  getOrgById,
  updateOrg,
  deleteOrg,
};