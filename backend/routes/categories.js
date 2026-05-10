const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Category } = require('../models/Menu');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ restaurant: req.user.restaurant._id, isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, categories });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const cat = await Category.create({ ...req.body, restaurant: req.user.restaurant._id });
    res.status(201).json({ success: true, message: 'Category created!', category: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Category deleted!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
