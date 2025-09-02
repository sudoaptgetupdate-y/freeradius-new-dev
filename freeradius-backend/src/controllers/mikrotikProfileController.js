// freeradius-backend/src/controllers/mikrotikProfileController.js
const profileService = require('../services/profileService'); // For delete
const mikrotikProfileService = require('../services/mikrotikProfileService');

const createProfile = async (req, res, next) => {
    try {
        const newProfile = await mikrotikProfileService.createMikrotikProfile(req.body);
        res.status(201).json({ success: true, data: newProfile });
    } catch (error) {
        next(error);
    }
};

const getProfiles = async (req, res, next) => {
    try {
        const result = await mikrotikProfileService.getMikrotikProfiles(req.query);
        res.status(200).json({
            success: true,
            data: {
                // Ensure the array property key matches what the frontend hook expects
                data: result.data, 
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const updatedProfile = await mikrotikProfileService.updateMikrotikProfile(req.params.id, req.body);
        res.status(200).json({ success: true, data: updatedProfile });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteProfile = async (req, res, next) => {
    try {
        await profileService.deleteProfile(req.params.id);
        res.status(200).json({ success: true, message: 'Profile deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createProfile,
    getProfiles,
    updateProfile,
    deleteProfile,
};