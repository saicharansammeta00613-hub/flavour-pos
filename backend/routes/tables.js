const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Table } = require('../models/Table');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, section } = req.query;
    const filter = { restaurant: req.user.restaurant._id, isActive: true };
    if (status) filter.status = status;
    if (section) filter.section = section;
    const tables = await Table.find(filter)
      .populate('currentOrder', 'orderNumber pricing.total status createdAt')
      .populate('currentWaiter', 'name')
      .sort({ tableNumber: 1 });
    res.json({ success: true, tables });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const table = await Table.create({ ...req.body, restaurant: req.user.restaurant._id });
    res.status(201).json({ success: true, message: 'Table created!', table });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, table });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (io) io.to(`restaurant_${req.user.restaurant._id}`).emit('table_updated', table);
    res.json({ success: true, table });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Table.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Table removed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
