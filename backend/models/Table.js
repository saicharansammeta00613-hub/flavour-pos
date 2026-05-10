const mongoose = require('mongoose');

// ─── Table Model ───────────────────────────────────────────────────────────────
const tableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true },
  name: { type: String }, // e.g. "Window Table", "VIP 1"
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  capacity: { type: Number, required: true, min: 1 },
  section: { type: String, default: 'Main Hall' }, // Indoor, Outdoor, Terrace, VIP
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning', 'blocked'],
    default: 'available'
  },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  currentWaiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  occupiedAt: Date,
  qrCode: String, // QR code URL for self-ordering
  isActive: { type: Boolean, default: true },
  positionX: { type: Number, default: 0 }, // For floor plan
  positionY: { type: Number, default: 0 },
  shape: { type: String, enum: ['square', 'round', 'rectangle'], default: 'square' }
}, {
  timestamps: true
});

// ─── Reservation Model ─────────────────────────────────────────────────────────
const reservationSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  reservationNumber: { type: String, unique: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String
  },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 60 }, // minutes
  guestCount: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  specialRequests: String,
  occasion: { type: String, enum: ['birthday', 'anniversary', 'business', 'date', 'family', 'other'] },
  depositAmount: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  whatsappConfirmSent: { type: Boolean, default: false },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Auto-generate reservation number
reservationSchema.pre('save', async function(next) {
  if (!this.reservationNumber) {
    const count = await mongoose.model('Reservation').countDocuments();
    this.reservationNumber = `RES${String(count + 1001).padStart(6, '0')}`;
  }
  next();
});

const Table = mongoose.model('Table', tableSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = { Table, Reservation };
