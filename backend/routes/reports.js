const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Order } = require('../models/Order');
const { Expense } = require('../models/Operations');

router.use(protect);

// Sales report
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const restaurantId = req.user.restaurant._id;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      restaurant: restaurantId,
      status: { $in: ['completed', 'delivered', 'picked_up'] },
      createdAt: { $gte: start, $lte: end }
    });

    const totalRevenue = orders.reduce((s, o) => s + o.pricing.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // Group by day
    const dailyData = {};
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!dailyData[day]) dailyData[day] = { date: day, revenue: 0, orders: 0 };
      dailyData[day].revenue += order.pricing.total;
      dailyData[day].orders += 1;
    });

    // Payment method breakdown
    const paymentBreakdown = {};
    orders.forEach(o => {
      const method = o.payment.method || 'unknown';
      if (!paymentBreakdown[method]) paymentBreakdown[method] = { method, count: 0, amount: 0 };
      paymentBreakdown[method].count++;
      paymentBreakdown[method].amount += o.pricing.total;
    });

    // Order type breakdown
    const typeBreakdown = { dine_in: 0, delivery: 0, pickup: 0 };
    orders.forEach(o => { if (typeBreakdown[o.type] !== undefined) typeBreakdown[o.type]++; });

    res.json({
      success: true,
      summary: { totalRevenue, totalOrders, avgOrderValue },
      dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      paymentBreakdown: Object.values(paymentBreakdown),
      typeBreakdown
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Top selling items
router.get('/top-items', async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const restaurantId = req.user.restaurant._id;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const result = await Order.aggregate([
      { $match: { restaurant: restaurantId, status: { $in: ['completed', 'delivered', 'picked_up'] }, createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total' } } },
      { $sort: { totalQty: -1 } },
      { $limit: Number(limit) }
    ]);

    res.json({ success: true, items: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Profit & Loss
router.get('/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const restaurantId = req.user.restaurant._id;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const [revenueResult, expenseResult] = await Promise.all([
      Order.aggregate([
        { $match: { restaurant: restaurantId, status: { $in: ['completed', 'delivered', 'picked_up'] }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Expense.aggregate([
        { $match: { restaurant: restaurantId, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ])
    ]);

    const revenue = revenueResult[0]?.total || 0;
    const totalExpenses = expenseResult.reduce((s, e) => s + e.total, 0);
    const profit = revenue - totalExpenses;

    res.json({
      success: true,
      revenue,
      totalExpenses,
      profit,
      profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0,
      expenseByCategory: expenseResult
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Hourly heatmap
router.get('/hourly', async (req, res) => {
  try {
    const restaurantId = req.user.restaurant._id;
    const start = new Date(new Date().setDate(new Date().getDate() - 7));

    const result = await Order.aggregate([
      { $match: { restaurant: restaurantId, status: { $in: ['completed', 'delivered'] }, createdAt: { $gte: start } } },
      { $group: { _id: { hour: { $hour: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
      { $sort: { '_id.hour': 1 } }
    ]);

    res.json({ success: true, hourlyData: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
