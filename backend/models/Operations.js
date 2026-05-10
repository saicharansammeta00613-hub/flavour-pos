const mongoose = require('mongoose');

// ─── Inventory Item ────────────────────────────────────────────────────────────
const inventorySchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  unit: { type: String, enum: ['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'box', 'packet', 'bottle'], required: true },
  currentStock: { type: Number, required: true, default: 0 },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 1000 },
  costPerUnit: { type: Number, default: 0 },
  supplier: String,
  supplierPhone: String,
  lastRestocked: Date,
  expiryDate: Date,
  location: String, // where it's stored
  barcode: String,
  isActive: { type: Boolean, default: true },
  transactions: [{
    type: { type: String, enum: ['in', 'out', 'adjustment', 'waste'] },
    quantity: Number,
    reason: String,
    reference: String, // order ID or purchase ID
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// ─── Expense Model ─────────────────────────────────────────────────────────────
const expenseSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['rent', 'salaries', 'utilities', 'ingredients', 'equipment', 'maintenance', 'marketing', 'licenses', 'other'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'], default: 'cash' },
  vendor: String,
  receipt: String, // file path
  notes: String,
  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ─── Staff Attendance ──────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  punchIn: Date,
  punchOut: Date,
  totalHours: Number,
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'leave', 'holiday'],
    default: 'present'
  },
  notes: String,
  overtime: { type: Number, default: 0 }, // extra hours
  leaves: [{
    type: { type: String, enum: ['sick', 'casual', 'earned', 'unpaid'] },
    from: Date,
    to: Date,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }]
}, { timestamps: true });

// ─── Delivery Executive ────────────────────────────────────────────────────────
const deliveryExecutiveSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String, enum: ['bike', 'scooter', 'bicycle', 'car'], default: 'bike' },
  vehicleNumber: String,
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  totalDeliveries: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  aadharNumber: String,
  licenseNumber: String,
  photo: String
}, { timestamps: true });

// ─── Cash Register ─────────────────────────────────────────────────────────────
const cashRegisterSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  date: { type: Date, default: Date.now },
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  openingBalance: { type: Number, default: 0 },
  closingBalance: Number,
  totalCashIn: { type: Number, default: 0 },
  totalCashOut: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  openedAt: { type: Date, default: Date.now },
  closedAt: Date,
  transactions: [{
    type: { type: String, enum: ['sale', 'refund', 'expense', 'deposit', 'withdrawal'] },
    amount: Number,
    description: String,
    reference: String,
    time: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  notes: String,
  discrepancy: Number
}, { timestamps: true });

const Inventory    = mongoose.model('Inventory', inventorySchema);
const Expense      = mongoose.model('Expense', expenseSchema);
const Attendance   = mongoose.model('Attendance', attendanceSchema);
const DeliveryExec = mongoose.model('DeliveryExecutive', deliveryExecutiveSchema);
const CashRegister = mongoose.model('CashRegister', cashRegisterSchema);

module.exports = { Inventory, Expense, Attendance, DeliveryExec, CashRegister };
