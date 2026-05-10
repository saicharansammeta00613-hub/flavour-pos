const express = require('express');
const router = express.Router();
const {
  createOrder, getOrders, getOrder, updateOrderStatus,
  processPayment, addItemsToOrder, getDailySummary
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary/today', getDailySummary);
router.route('/').get(getOrders).post(createOrder);
router.route('/:id').get(getOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/payment', processPayment);
router.post('/:id/add-items', addItemsToOrder);

module.exports = router;
