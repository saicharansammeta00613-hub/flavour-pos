const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Inventory } = require('../models/Operations');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { lowStock, category } = req.query;
    const filter = { restaurant: req.user.restaurant._id, isActive: true };
    if (category) filter.category = category;
    let items = await Inventory.find(filter).sort({ name: 1 });
    if (lowStock === 'true') items = items.filter(i => i.currentStock <= i.minStock);
    res.json({ success: true, items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const item = await Inventory.create({ ...req.body, restaurant: req.user.restaurant._id });
    res.status(201).json({ success: true, message: 'Inventory item added!', item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/transaction', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { type, quantity, reason } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (type === 'in') item.currentStock += quantity;
    else if (type === 'out' || type === 'waste') item.currentStock = Math.max(0, item.currentStock - quantity);
    else if (type === 'adjustment') item.currentStock = quantity;

    item.transactions.push({ type, quantity, reason, performedBy: req.user._id, date: new Date() });
    if (type === 'in') item.lastRestocked = new Date();
    await item.save();

    if (item.currentStock <= item.minStock && io) {
      io.to(`restaurant_${item.restaurant}`).emit('low_stock_alert', {
        item: item.name, currentStock: item.currentStock, minStock: item.minStock, unit: item.unit
      });
    }

    res.json({ success: true, message: 'Stock updated!', item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Inventory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Item removed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
