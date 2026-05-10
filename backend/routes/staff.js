const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { Attendance } = require('../models/Operations');

router.use(protect);

// Get all staff
router.get('/', async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const filter = { restaurant: req.user.restaurant._id };
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const staff = await User.find(filter).select('-password').sort({ name: 1 });
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Add staff member
router.post('/', async (req, res) => {
  try {
    const staffData = {
      ...req.body,
      restaurant: req.user.restaurant._id,
      password: req.body.password || 'flavour123'
    };
    const staff = await User.create(staffData);
    res.status(201).json({ success: true, message: 'Staff member added!', staff: { ...staff.toObject(), password: undefined } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update staff
router.put('/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const staff = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Toggle staff active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    staff.isActive = !staff.isActive;
    await staff.save({ validateBeforeSave: false });
    res.json({ success: true, message: `Staff ${staff.isActive ? 'activated' : 'deactivated'}`, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delete staff
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Staff removed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Attendance - punch in/out
router.post('/attendance/punch', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { staffId, type } = req.body;
    const today = new Date(); today.setHours(0,0,0,0);

    let attendance = await Attendance.findOne({
      staff: staffId, restaurant: req.user.restaurant._id, date: { $gte: today }
    });

    if (!attendance) {
      attendance = await Attendance.create({
        staff: staffId, restaurant: req.user.restaurant._id, date: new Date(),
        punchIn: type === 'in' ? new Date() : undefined, status: 'present'
      });
    } else if (type === 'out' && !attendance.punchOut) {
      attendance.punchOut = new Date();
      const diff = (attendance.punchOut - attendance.punchIn) / (1000 * 60 * 60);
      attendance.totalHours = Math.round(diff * 100) / 100;
      await attendance.save();
    }

    if (io) io.to(`restaurant_${req.user.restaurant._id}`).emit('attendance_updated', attendance);
    res.json({ success: true, message: `Punch ${type} recorded!`, attendance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get attendance records
router.get('/attendance', async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    const filter = { restaurant: req.user.restaurant._id };
    if (staffId) filter.staff = staffId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const records = await Attendance.find(filter).populate('staff', 'name employeeId role').sort({ date: -1 });
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
