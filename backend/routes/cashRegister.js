const express = require('express');
const { protect } = require('../middleware/auth');
const { CashRegister } = require('../models/Operations');

const router = express.Router();
router.use(protect);

router.get('/current', async (req, res) => {
  try {
    const register = await CashRegister.findOne({ restaurant: req.user.restaurant._id, status: 'open' })
      .populate('openedBy', 'name').populate('transactions.performedBy', 'name');
    res.json({ success: true, register });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/open', async (req, res) => {
  try {
    const existing = await CashRegister.findOne({ restaurant: req.user.restaurant._id, status: 'open' });
    if (existing) return res.status(400).json({ success: false, message: 'A cash register is already open!' });
    const register = await CashRegister.create({
      restaurant: req.user.restaurant._id, openedBy: req.user._id, openingBalance: req.body.openingBalance || 0
    });
    res.status(201).json({ success: true, message: 'Cash register opened!', register });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/close', async (req, res) => {
  try {
    const register = await CashRegister.findOne({ restaurant: req.user.restaurant._id, status: 'open' });
    if (!register) return res.status(404).json({ success: false, message: 'No open register found!' });
    register.status = 'closed';
    register.closedBy = req.user._id;
    register.closedAt = new Date();
    register.closingBalance = req.body.closingBalance;
    register.discrepancy = req.body.closingBalance - (register.openingBalance + register.totalCashIn - register.totalCashOut);
    register.notes = req.body.notes;
    await register.save();
    res.json({ success: true, message: 'Cash register closed!', register });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/transaction', async (req, res) => {
  try {
    const register = await CashRegister.findOne({ restaurant: req.user.restaurant._id, status: 'open' });
    if (!register) return res.status(404).json({ success: false, message: 'No open register found!' });
    const { type, amount, description } = req.body;
    if (type === 'deposit' || type === 'sale') register.totalCashIn += amount;
    else if (type === 'withdrawal' || type === 'expense') register.totalCashOut += amount;
    register.transactions.push({ type, amount, description, performedBy: req.user._id });
    await register.save();
    res.json({ success: true, message: 'Transaction recorded!', register });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const registers = await CashRegister.find({ restaurant: req.user.restaurant._id })
      .populate('openedBy', 'name').populate('closedBy', 'name').sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, registers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
