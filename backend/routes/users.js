const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const users = await User.find({ restaurant: req.user.restaurant._id }).select('-password').sort({ name: 1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/permissions', authorize('admin', 'superadmin', 'manager'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { permissions: req.body.permissions }, { new: true }).select('-password');
    res.json({ success: true, message: 'Permissions updated!', user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
