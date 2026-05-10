// ===================== SETTINGS ROUTE =====================
const express = require('express');
const sRouter = express.Router();
const { protect } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');

sRouter.use(protect);

sRouter.get('/', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurant._id);
    res.json({ success: true, settings: restaurant });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

sRouter.put('/', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.user.restaurant._id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Settings saved!', settings: restaurant });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = sRouter;
