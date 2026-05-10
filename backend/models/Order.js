const mongoose = require('mongoose');

// ─── KoT (Kitchen Order Ticket) ───────────────────────────────────────────────
const kotSchema = new mongoose.Schema({
  kotNumber: { type: String, required: true, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: String,
    quantity: Number,
    variant: String,
    addons: [{ name: String, price: Number }],
    specialInstructions: String,
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'served'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  type: { type: String, enum: ['dine_in', 'delivery', 'pickup'], default: 'dine_in' },
  waiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  prepStartTime: Date,
  readyTime: Date,
  specialNotes: String,
  printCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// ─── Order Model ───────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  type: {
    type: String,
    enum: ['dine_in', 'delivery', 'pickup'],
    required: true,
    default: 'dine_in'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'out_for_delivery', 'delivered', 'picked_up', 'completed', 'cancelled'],
    default: 'pending'
  },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  customer: {
    name: { type: String, default: 'Walk-in Customer' },
    phone: String,
    address: String,
    email: String
  },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variant: String,
    addons: [{
      name: String,
      price: Number
    }],
    specialInstructions: String,
    total: Number,
    kotStatus: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'served'],
      default: 'pending'
    }
  }],
  kot: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KoT' }],
  pricing: {
    subtotal: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
    total: { type: Number, required: true }
  },
  payment: {
    method: { type: String, enum: ['cash', 'card', 'upi', 'wallet', 'credit', 'mixed', 'pending'], default: 'pending' },
    status: { type: String, enum: ['pending', 'partial', 'paid', 'refunded'], default: 'pending' },
    paidAmount: { type: Number, default: 0 },
    changeAmount: { type: Number, default: 0 },
    transactionId: String,
    paidAt: Date
  },
  waiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryExecutive' },
  numberOfGuests: { type: Number, default: 1 },
  specialInstructions: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  whatsappBillSent: { type: Boolean, default: false },
  cancelReason: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date
}, {
  timestamps: true
});

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const now = new Date();
    const prefix = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const count = await mongoose.model('Order').countDocuments({
      createdAt: { $gte: startOfDay }
    });
    this.orderNumber = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const KoT = mongoose.model('KoT', kotSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { Order, KoT };