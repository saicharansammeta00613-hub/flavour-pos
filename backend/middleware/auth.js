const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect routes - verify JWT ───────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('restaurant');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ─── Role authorization ────────────────────────────────────────────────────────
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action.`
      });
    }
    next();
  };
};

// ─── Check specific permission ─────────────────────────────────────────────────
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    const adminRoles = ['superadmin', 'admin', 'manager'];
    if (adminRoles.includes(req.user.role)) return next();

    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission for this action.'
      });
    }
    next();
  };
};
