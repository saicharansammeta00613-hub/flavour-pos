const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Reservation } = require('../models/Table');
const whatsapp = require('../utils/whatsapp');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = { restaurant: req.user.restaurant._id };
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    }
    const reservations = await Reservation.find(filter)
      .populate('table', 'tableNumber name capacity section')
      .populate('createdBy', 'name')
      .sort({ date: 1, time: 1 });
    res.json({ success: true, reservations });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const reservation = await Reservation.create({ ...req.body, restaurant: req.user.restaurant._id, createdBy: req.user._id });
    // Send WhatsApp confirmation
    try { await whatsapp.sendReservationConfirmation(reservation); } catch (e) {}
    res.status(201).json({ success: true, message: 'Reservation created! WhatsApp confirmation sent.', reservation });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, reservation });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: `Reservation ${status}`, reservation });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Reservation deleted!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
