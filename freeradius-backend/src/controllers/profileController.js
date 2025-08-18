// src/controllers/profileController.js
const profileService = require('../services/profileService');

const getProfiles = async (req, res, next) => {
  try {
    const profiles = await profileService.getAllProfiles();
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const profile = await profileService.createProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileById(req.params.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// --- START: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---
const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await profileService.updateProfile(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedProfile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// --- END: ฟังก์ชันที่เพิ่มเข้ามาใหม่ ---

const removeProfile = async (req, res, next) => {
  try {
    await profileService.deleteProfile(req.params.id);
    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfiles,
  createProfile,
  getProfile,
  updateProfile, // <-- Export ฟังก์ชันใหม่
  removeProfile,
};