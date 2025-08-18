// src/controllers/advertisementController.js
const adService = require('../services/advertisementService');

const getAllAds = async (req, res, next) => {
  try {
    const ads = await adService.getAllAdvertisements();
    res.status(200).json({ success: true, data: ads });
  } catch (error) {
    next(error);
  }
};

const createAd = async (req, res, next) => {
  try {
    const newAd = await adService.createAdvertisement(req.body);
    res.status(201).json({ success: true, data: newAd });
  } catch (error) {
    next(error);
  }
};

const updateAd = async (req, res, next) => {
  try {
    const updatedAd = await adService.updateAdvertisement(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedAd });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteAd = async (req, res, next) => {
  try {
    await adService.deleteAdvertisement(req.params.id);
    res.status(200).json({ success: true, message: 'Advertisement deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAds,
  createAd,
  updateAd,
  deleteAd,
};