const User = require('../models/User');

/**
 * Middleware to restrict routes to the Master Admin only (Session Based)
 */
const adminOnly = async (req, res, next) => {
  try {
    // Check session first
    if (!req.session.isAuth || !req.session.userId) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Hardcoded Master Admin Protection
    const MASTER_ADMIN = 'hafezzargar987@gmail.com';
    
    if (user.email === MASTER_ADMIN) {
      req.admin = user;
      return next();
    }

    return res.status(403).json({ message: 'Access denied. Master Admin only.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin check' });
  }
};

module.exports = { adminOnly };
