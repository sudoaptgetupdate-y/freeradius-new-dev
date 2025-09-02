const profileService = require('../services/profileService'); // For delete
const mikrotikProfileService = require('../services/mikrotikProfileService');

const createProfile = async (req, res, next) => {
    try {
        const profile = await mikrotikProfileService.createMikrotikProfile(req.body);
        res.status(201).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

const getProfiles = async (req, res, next) => {
    try {
        const result = await mikrotikProfileService.getMikrotikProfiles(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await mikrotikProfileService.updateMikrotikProfile(parseInt(id), req.body);
        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

const deleteProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        await profileService.deleteProfile(parseInt(id));
        res.status(200).json({
            success: true,
            message: 'Profile deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProfile,
    getProfiles,
    updateProfile,
    deleteProfile,
};