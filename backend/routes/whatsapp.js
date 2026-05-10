// ===================== WHATSAPP ROUTE =====================
const express = require('express');
const wRouter = express.Router();
const { protect } = require('../middleware/auth');
const whatsapp = require('../utils/whatsapp');

wRouter.use(protect);

wRouter.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    const result = await whatsapp.sendCustomMessage(phone, message);
    if (result.success) res.json({ success: true, message: 'WhatsApp message sent!' });
    else res.status(400).json({ success: false, message: result.message });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

wRouter.post('/send-bill/:orderId', async (req, res) => {
  try {
    const { Order } = require('../models/Order');
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const sent = await whatsapp.sendBill(order);
    if (sent) {
      order.whatsappBillSent = true;
      await order.save({ validateBeforeSave: false });
      res.json({ success: true, message: 'Bill sent on WhatsApp!' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to send bill. Check WhatsApp configuration.' });
    }
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = wRouter;
