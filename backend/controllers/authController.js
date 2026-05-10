const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { validationResult } = require('express-validator');

// ─── Register (first-time setup) ───────────────────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { name, email, password, phone, restaurantName, restaurantType, restaurantPhone, restaurantAddress } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create restaurant first
    const restaurant = await Restaurant.create({
      name: restaurantName || `${name}'s Restaurant`,
      type: restaurantType || 'restaurant',
      phone: restaurantPhone || phone,
      address: { street: restaurantAddress || '' }
    });

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'admin',
      restaurant: restaurant._id,
      permissions: {
        canManageOrders: true,
        canManageMenu: true,
        canManageStaff: true,
        canViewReports: true,
        canManageInventory: true,
        canManageCashRegister: true
      }
    });

    restaurant.owner = user._id;
    await restaurant.save();

    const token = user.getSignedToken();

    res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully! Welcome to FLAVOUR POS.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        restaurant: restaurant
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password').populate('restaurant');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedToken();

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        permissions: user.permissions,
        restaurant: user.restaurant
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get current user ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('restaurant');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Update profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).populate('restaurant');

    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Change password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
