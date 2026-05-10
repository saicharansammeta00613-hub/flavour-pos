const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Expense } = require('../models/Operations');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = { restaurant: req.user.restaurant._id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .populate('addedBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const totalAmount = await Expense.aggregate([
      { $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, expenses, total, totalAmount: totalAmount[0]?.total || 0, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, restaurant: req.user.restaurant._id, addedBy: req.user._id });
    res.status(201).json({ success: true, message: 'Expense recorded!', expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Expense deleted!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
