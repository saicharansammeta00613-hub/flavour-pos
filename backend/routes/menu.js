// ===================== MENU ROUTES =====================
const express = require('express');
const menuRouter = express.Router();
const { protect } = require('../middleware/auth');
const { MenuItem } = require('../models/Menu');

menuRouter.use(protect);

menuRouter.get('/', async (req, res) => {
  try {
    const { category, available, search } = req.query;
    const filter = { restaurant: req.user.restaurant._id };
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const items = await MenuItem.find(filter).populate('category', 'name color icon').sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, count: items.length, items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

menuRouter.post('/', async (req, res) => {
  try {
    const item = await MenuItem.create({ ...req.body, restaurant: req.user.restaurant._id });
    res.status(201).json({ success: true, message: 'Menu item created!', item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

menuRouter.put('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Item updated!', item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

menuRouter.delete('/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Item deleted!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

menuRouter.patch('/:id/toggle', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, message: `Item ${item.isAvailable ? 'enabled' : 'disabled'}`, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = menuRouter;
