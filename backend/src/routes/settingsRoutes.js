const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }
    res.sendSuccess(settings);
  } catch (error) {
    res.sendError(error.message, 500);
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (settings) {
      settings = await CompanySettings.findByIdAndUpdate(settings._id, req.body, { new: true });
    } else {
      settings = await CompanySettings.create(req.body);
    }
    res.sendSuccess(settings, 'Settings updated successfully');
  } catch (error) {
    res.sendError(error.message, 500);
  }
});

module.exports = router;
