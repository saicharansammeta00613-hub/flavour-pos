const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { DeliveryExec } = require('../models/Operations');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const execs = await DeliveryExec.find({ restaurant: req.user.restaurant._id, isActive: true })
      .populate('currentOrder', 'orderNumber customer.name customer.address');
    res.json({ success: true, executives: execs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const exec = await DeliveryExec.create({ ...req.body, restaurant: req.user.restaurant._id });
    res.status(201).json({ success: true, message: 'Delivery executive added!', executive: exec });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const exec = await DeliveryExec.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, executive: exec });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id/availability', async (req, res) => {
  try {
    const exec = await DeliveryExec.findByIdAndUpdate(req.params.id, { isAvailable: req.body.isAvailable }, { new: true });
    res.json({ success: true, executive: exec });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id/assign-order', async (req, res) => {
  try {
    const io = req.app.get('io');
    const exec = await DeliveryExec.findByIdAndUpdate(req.params.id,
      { currentOrder: req.body.orderId, isAvailable: false }, { new: true });
    if (io) io.to('delivery_team').emit('order_assigned', { executive: exec, orderId: req.body.orderId });
    res.json({ success: true, executive: exec });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await DeliveryExec.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Executive removed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
