const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendApprovalEmail } = require('../services/emailService');

/**
 * Handle Registration with Password
 */
exports.register = async (req, res) => {
  try {
    const { email, username, name, phone, password, isTermsAccepted } = req.body;

    if (!email || !username || !name || !phone || !password || !isTermsAccepted) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken. Please choose another.' });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = new User({
      email,
      username,
      name,
      phone,
      password: hashedPassword,
      isTermsAccepted,
      isRegistered: true,
      status: 'PENDING'
    });

    await user.save();

    res.json({ message: 'Registration successful! Please wait for admin approval.' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Handle Login with Password
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // SETUP SESSION
    req.session.userId = user._id;
    req.session.isAuth = true;
    req.session.email = user.email;

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        isRegistered: user.isRegistered,
        status: user.status,
        subjectPerformance: user.subjectPerformance || []
      }
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Check Session Status
 */
exports.checkAuth = async (req, res) => {
  if (req.session.isAuth) {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) return res.json({ isAuthenticated: false });
      return res.json({ isAuthenticated: true, user });
    } catch (err) {
      return res.json({ isAuthenticated: false });
    }
  }
  res.json({ isAuthenticated: false });
};

/**
 * Admin: Get All Pending Users
 */
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'PENDING', isRegistered: true });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Approve User
 */
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(userId, { status: 'APPROVED' }, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Notify the user via email
    await sendApprovalEmail(user.email, user.name);

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Logout
 */
exports.logout = (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.json({ message: 'Logged out' });
};
