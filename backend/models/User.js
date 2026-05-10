const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'delivery', 'staff'],
    default: 'staff'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  // Staff-specific fields
  employeeId: String,
  designation: String,
  salary: Number,
  joiningDate: Date,
  address: String,
  emergencyContact: String,
  aadharNumber: String,
  bankAccount: String,
  ifscCode: String,
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
    default: 'flexible'
  },
  permissions: {
    canManageOrders: { type: Boolean, default: true },
    canManageMenu: { type: Boolean, default: false },
    canManageStaff: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canManageCashRegister: { type: Boolean, default: false }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);
