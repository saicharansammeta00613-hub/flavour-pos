const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { KoT } = require('../models/Order');

router.use(protect);

// Get all active KoTs for kitchen display
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { restaurant: req.user.restaurant._id };
if (status) {
  const statusArray = status.split(',').map(s => s.trim());
  filter.status = { $in: statusArray };
}  else {
  filter.status = { $in: ['pending', 'preparing', 'ready'] };
}

    const kots = await KoT.find(filter)
      .populate('order', 'orderNumber type customer numberOfGuests')
      .populate('table', 'tableNumber name section')
      .populate('waiter', 'name')
      .sort({ priority: -1, createdAt: 1 });
    res.json({ success: true, kots });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update KoT status
router.patch('/:id/status', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { status, itemIndex } = req.body;
    const kot = await KoT.findById(req.params.id).populate('order').populate('table', 'tableNumber');

    if (!kot) return res.status(404).json({ success: false, message: 'KoT not found' });

    if (itemIndex !== undefined) {
      // Update single item status
      kot.items[itemIndex].status = status;
      const allReady = kot.items.every(i => i.status === 'ready' || i.status === 'served');
      if (allReady) kot.status = 'ready';
    } else {
      kot.status = status;
      kot.items.forEach(i => i.status = status);
      if (status === 'preparing') kot.prepStartTime = new Date();
      if (status === 'ready') kot.readyTime = new Date();
    }

    await kot.save();

    if (io) {
      io.to(`restaurant_${kot.restaurant}`).emit('kot_status_changed', kot);
      if (status === 'ready' && kot.order?.waiter) {
        io.to(`user_${kot.order.waiter}`).emit('kot_ready', {
          kotNumber: kot.kotNumber,
          table: kot.table?.tableNumber,
          message: `KoT ${kot.kotNumber} is READY for serving!`
        });
      }
    }

    res.json({ success: true, message: `KoT status updated to ${status}`, kot });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Set KoT priority
router.patch('/:id/priority', async (req, res) => {
  try {
    const kot = await KoT.findByIdAndUpdate(req.params.id, { priority: req.body.priority }, { new: true });
    res.json({ success: true, kot });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
