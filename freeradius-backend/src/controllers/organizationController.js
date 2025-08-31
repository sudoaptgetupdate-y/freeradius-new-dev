// src/controllers/organizationController.js

const organizationService = require('../services/organizationService');

// Get all organizations
exports.getAllOrganizations = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, search } = req.query;
        const result = await organizationService.getAllOrganizations(parseInt(page), parseInt(pageSize), search);
        res.json({
            message: 'Organizations retrieved successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Create a new organization
exports.createOrganization = async (req, res, next) => {
    try {
        // --- START: EDIT ---
        const { name, login_identifier_type, auto_create_user, default_profile_id, advertisementCampaignId } = req.body;

        const orgData = {
            name,
            login_identifier_type,
            auto_create_user,
            default_profile_id,
            advertisementCampaignId: advertisementCampaignId === '' ? null : advertisementCampaignId,
        };
        
        const organization = await organizationService.createOrganization(orgData);
        // --- END: EDIT ---
        res.status(201).json({
            message: 'Organization created successfully',
            data: organization,
        });
    } catch (error) {
        next(error);
    }
};

// Get an organization by ID
exports.getOrganizationById = async (req, res, next) => {
    try {
        const organization = await organizationService.getOrganizationById(parseInt(req.params.id));
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.json({
            message: 'Organization retrieved successfully',
            data: organization,
        });
    } catch (error) {
        next(error);
    }
};

// Update an organization
exports.updateOrganization = async (req, res, next) => {
    try {
        const organization = await organizationService.updateOrganization(parseInt(req.params.id), req.body);
        res.json({
            message: 'Organization updated successfully',
            data: organization,
        });
    } catch (error) {
        next(error);
    }
};

// Delete an organization
exports.deleteOrganization = async (req, res, next) => {
    try {
        await organizationService.deleteOrganization(parseInt(req.params.id));
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};