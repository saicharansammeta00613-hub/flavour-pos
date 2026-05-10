const mongoose = require('mongoose');

// ─── Category Model ────────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  description: String,
  image: String,
  icon: String,
  color: { type: String, default: '#FF6B35' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

// ─── Menu Item Model ───────────────────────────────────────────────────────────
const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  discountedPrice: { type: Number, min: 0 },
  image: String,
  isVeg: { type: Boolean, default: true },
  isJain: { type: Boolean, default: false },
  spiceLevel: {
    type: String,
    enum: ['none', 'mild', 'medium', 'hot', 'extra_hot'],
    default: 'none'
  },
  prepTime: { type: Number, default: 15 }, // in minutes
  calories: Number,
  allergens: [String],
  variants: [{
    name: String,
    price: Number
  }],
  addons: [{
    name: String,
    price: Number,
    isAvailable: { type: Boolean, default: true }
  }],
  tags: [String], // bestseller, new, chef_special etc
  isAvailable: { type: Boolean, default: true },
  isAvailableForDineIn: { type: Boolean, default: true },
  isAvailableForDelivery: { type: Boolean, default: true },
  isAvailableForPickup: { type: Boolean, default: true },
  stock: { type: Number, default: -1 }, // -1 = unlimited
  sortOrder: { type: Number, default: 0 },
  ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = { Category, MenuItem };
