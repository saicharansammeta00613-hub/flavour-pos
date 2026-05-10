const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['restaurant', 'tiffin_center', 'cafeteria', 'fast_food', 'cloud_kitchen', 'bakery', 'juice_center', 'other'],
    default: 'restaurant'
  },
  logo: String,
  phone: { type: String, required: true },
  altPhone: String,
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  gstin: String,
  fssaiNumber: String,
  taxSettings: {
    cgst: { type: Number, default: 2.5 },
    sgst: { type: Number, default: 2.5 },
    igst: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    taxIncluded: { type: Boolean, default: false }
  },
  currency: { type: String, default: '₹' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '23:00' },
  isOpen: { type: Boolean, default: true },
  facilities: {
    dineIn: { type: Boolean, default: true },
    delivery: { type: Boolean, default: true },
    pickup: { type: Boolean, default: true },
    tableReservation: { type: Boolean, default: true }
  },
  whatsappSettings: {
    enabled: { type: Boolean, default: false },
    adminNumber: String,
    sendBillToCustomer: { type: Boolean, default: true },
    sendOrderConfirmation: { type: Boolean, default: true },
    sendKotToKitchen: { type: Boolean, default: false }
  },
  printSettings: {
    billHeader: String,
    billFooter: { type: String, default: 'Thank you for visiting! Come again.' },
    showLogo: { type: Boolean, default: true },
    copies: { type: Number, default: 1 }
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    website: String
  },
  isActive: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
