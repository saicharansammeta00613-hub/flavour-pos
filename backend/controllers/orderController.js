const { Order, KoT } = require('../models/Order');
const { Table } = require('../models/Table');
const { MenuItem } = require('../models/Menu');
const { CashRegister } = require('../models/Operations');
const whatsappService = require('../utils/whatsapp');
const moment = require('moment');

// Helper: generate KoT number
const generateKotNumber = async () => {
  const today = new Date();
  const prefix = `KOT${String(today.getDate()).padStart(2,'0')}${String(today.getMonth()+1).padStart(2,'0')}`;
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const count = await KoT.countDocuments({ createdAt: { $gte: startOfDay }});
  return `${prefix}${String(count+1).padStart(3,'0')}`;
};

// Helper: generate Order number
const generateOrderNumber = async () => {
  const now = new Date();
  const prefix = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const count = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

// ─── Create Order ──────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { type, tableId, items, customer, pricing, numberOfGuests, specialInstructions } = req.body;

    // Validate and enrich items
    const enrichedItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) continue;

      const addonTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
      const itemPrice = item.variant
        ? (menuItem.variants.find(v => v.name === item.variant)?.price || menuItem.price)
        : (menuItem.discountedPrice || menuItem.price);

      enrichedItems.push({
        menuItem: item.menuItem,
        name: menuItem.name,
        price: itemPrice,
        quantity: item.quantity,
        variant: item.variant,
        addons: item.addons || [],
        specialInstructions: item.specialInstructions,
        total: (itemPrice + addonTotal) * item.quantity
      });
    }

    const subtotal = enrichedItems.reduce((s, i) => s + i.total, 0);
    const restaurant = req.user.restaurant;

    const orderNumber = await generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      restaurant: restaurant._id,
      type,
      table: tableId || null,
      customer: customer || { name: 'Walk-in Customer' },
      items: enrichedItems,
      pricing: {
        subtotal,
        cgst: pricing?.cgst || (subtotal * 0.025),
        sgst: pricing?.sgst || (subtotal * 0.025),
        serviceCharge: pricing?.serviceCharge || 0,
        deliveryCharge: type === 'delivery' ? (pricing?.deliveryCharge || 0) : 0,
        discount: pricing?.discount || 0,
        total: pricing?.total || subtotal + (subtotal * 0.05)
      },
      waiter: req.user._id,
      numberOfGuests: numberOfGuests || 1,
      specialInstructions
    });

    // Update table status
    if (tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        currentOrder: order._id,
        currentWaiter: req.user._id,
        occupiedAt: new Date()
      });
    }

    // Create KoT
    const kotNumber = await generateKotNumber();
    const kot = await KoT.create({
      kotNumber,
      order: order._id,
      restaurant: restaurant._id,
      table: tableId || null,
      items: enrichedItems.map(i => ({
        menuItem: i.menuItem,
        name: i.name,
        quantity: i.quantity,
        variant: i.variant,
        addons: i.addons,
        specialInstructions: i.specialInstructions
      })),
      type,
      waiter: req.user._id
    });

    order.kot.push(kot._id);
    order.status = 'confirmed';
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('table').populate('waiter', 'name').populate('kot');

    // Emit to kitchen in real-time
    if (io) {
      io.to('kitchen_display').emit('kot_received', {
        kot: { ...kot.toObject(), kotNumber },
        order: populatedOrder,
        alert: true
      });
      io.to(`restaurant_${restaurant._id}`).emit('order_created', populatedOrder);
    }

    res.status(201).json({
      success: true,
      message: 'Order created and KoT sent to kitchen!',
      order: populatedOrder,
      kot
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get All Orders ────────────────────────────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { status, type, date, page = 1, limit = 20 } = req.query;
    const restaurantId = req.user.restaurant._id;

    const filter = { restaurant: restaurantId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (date) {
      const d = new Date(date);
      filter.createdAt = {
        $gte: new Date(d.setHours(0,0,0,0)),
        $lt: new Date(d.setHours(23,59,59,999))
      };
    } else if (!date && !status) {
      // Default: today's orders
      const today = new Date();
      filter.createdAt = {
        $gte: new Date(today.setHours(0,0,0,0)),
        $lt: new Date(today.setHours(23,59,59,999))
      };
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('table', 'tableNumber name section')
      .populate('waiter', 'name phone')
      .populate('cashier', 'name')
      .populate('deliveryExecutive', 'name phone vehicleType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Single Order ──────────────────────────────────────────────────────────
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table').populate('waiter', 'name phone').populate('cashier', 'name')
      .populate('deliveryExecutive').populate('kot');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Update Order Status ───────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { status, cancelReason } = req.body;

    const order = await Order.findById(req.params.id).populate('table');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.status = status;
    if (cancelReason) {
      order.cancelReason = cancelReason;
      order.cancelledBy = req.user._id;
    }
    if (['completed', 'delivered', 'picked_up'].includes(status)) {
      order.completedAt = new Date();
      // Free up table
      if (order.table) {
        await Table.findByIdAndUpdate(order.table._id, {
          status: 'available',
          currentOrder: null,
          currentWaiter: null
        });
      }
    }

    await order.save();

    if (io) {
      io.to(`restaurant_${order.restaurant}`).emit('order_status_changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status
      });
    }

    res.json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Process Payment ───────────────────────────────────────────────────────────
exports.processPayment = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { method, paidAmount, transactionId } = req.body;

    const order = await Order.findById(req.params.id).populate('table').populate('waiter', 'name');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.payment = {
      method,
      status: 'paid',
      paidAmount,
      changeAmount: paidAmount - order.pricing.total,
      transactionId,
      paidAt: new Date()
    };
    order.status = 'completed';
    order.cashier = req.user._id;
    order.completedAt = new Date();

    // Free table
    if (order.table) {
      await Table.findByIdAndUpdate(order.table._id, {
        status: 'available',
        currentOrder: null,
        currentWaiter: null
      });
    }

    // Add to cash register if cash payment
    if (method === 'cash') {
      const register = await CashRegister.findOne({
        restaurant: order.restaurant,
        status: 'open'
      });
      if (register) {
        register.totalCashIn += paidAmount;
        register.totalSales += order.pricing.total;
        register.transactions.push({
          type: 'sale',
          amount: paidAmount,
          description: `Order #${order.orderNumber}`,
          reference: order._id,
          performedBy: req.user._id
        });
        await register.save();
      }
    }

    await order.save();

    // Send WhatsApp bill
    if (order.customer?.phone) {
      try {
        await whatsappService.sendBill(order);
        order.whatsappBillSent = true;
        await order.save({ validateBeforeSave: false });
      } catch (wErr) {
        console.log('WhatsApp send failed (non-critical):', wErr.message);
      }
    }

    if (io) {
      io.to(`restaurant_${order.restaurant}`).emit('payment_completed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.pricing.total
      });
    }

    res.json({ success: true, message: 'Payment processed successfully!', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Add Items to Existing Order ───────────────────────────────────────────────
exports.addItemsToOrder = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { items } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot add items to a paid order.' });
    }

    const newItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) continue;
      const itemPrice = menuItem.discountedPrice || menuItem.price;
      const addonTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
      newItems.push({
        menuItem: item.menuItem,
        name: menuItem.name,
        price: itemPrice,
        quantity: item.quantity,
        addons: item.addons || [],
        specialInstructions: item.specialInstructions,
        total: (itemPrice + addonTotal) * item.quantity
      });
      order.items.push(...newItems);
    }

    // Recalculate pricing
    const subtotal = order.items.reduce((s, i) => s + i.total, 0);
    order.pricing.subtotal = subtotal;
    order.pricing.cgst = subtotal * 0.025;
    order.pricing.sgst = subtotal * 0.025;
    order.pricing.total = subtotal + order.pricing.cgst + order.pricing.sgst +
      order.pricing.serviceCharge + order.pricing.deliveryCharge - order.pricing.discount;

    // New KoT for added items
    const kotNumber = await generateKotNumber();
    const kot = await KoT.create({
      kotNumber,
      order: order._id,
      restaurant: order.restaurant,
      table: order.table,
      items: newItems,
      type: order.type,
      waiter: req.user._id
    });
    order.kot.push(kot._id);
    await order.save();

    if (io) {
      io.to('kitchen_display').emit('kot_received', { kot, order, alert: true });
    }

    res.json({ success: true, message: 'Items added and new KoT sent!', order, kot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Today's Summary ───────────────────────────────────────────────────────────
exports.getDailySummary = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant._id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0));
    const endOfDay = new Date(today.setHours(23,59,59,999));

    const [totalOrders, completedOrders, pendingOrders, cancelledOrders] = await Promise.all([
      Order.countDocuments({ restaurant: restaurantId, createdAt: { $gte: startOfDay, $lte: endOfDay }}),
      Order.find({ restaurant: restaurantId, status: 'completed', createdAt: { $gte: startOfDay }}),
      Order.countDocuments({ restaurant: restaurantId, status: { $in: ['pending','confirmed','preparing'] }, createdAt: { $gte: startOfDay }}),
      Order.countDocuments({ restaurant: restaurantId, status: 'cancelled', createdAt: { $gte: startOfDay }})
    ]);

    const totalRevenue = completedOrders.reduce((s, o) => s + o.pricing.total, 0);
    const avgOrderValue = completedOrders.length ? totalRevenue / completedOrders.length : 0;

    const dineInCount   = completedOrders.filter(o => o.type === 'dine_in').length;
    const deliveryCount = completedOrders.filter(o => o.type === 'delivery').length;
    const pickupCount   = completedOrders.filter(o => o.type === 'pickup').length;

    res.json({
      success: true,
      summary: {
        totalOrders,
        completedOrders: completedOrders.length,
        pendingOrders,
        cancelledOrders,
        totalRevenue,
        avgOrderValue,
        byType: { dineIn: dineInCount, delivery: deliveryCount, pickup: pickupCount }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};