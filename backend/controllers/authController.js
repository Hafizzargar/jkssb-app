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

    // AUTO-LOGIN: Setup session immediately after registration
    req.session.userId = user._id;
    req.session.isAuth = true;
    req.session.email = user.email;

    res.json({ 
      message: 'Registration successful! Welcome aboard.',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        isRegistered: user.isRegistered,
        status: user.status,
        subjectPerformance: []
      }
    });
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

    // Check if user is DISABLED
    if (user.status === 'DISABLED') {
      return res.status(403).json({ 
        message: 'Your account is disabled. Please contact the team for assistance.' 
      });
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
    // Hide the Super Admin from the list
    const users = await User.find({ 
      isRegistered: true,
      email: { $ne: 'hafezzargar987@gmail.com' } 
    }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Disable User (Soft Lock)
 */
exports.disableUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Safety Check: Never allow disabling the Super Admin
    const user = await User.findById(userId);
    if (user && user.email === 'hafezzargar987@gmail.com') {
      return res.status(403).json({ message: 'Super Admin account is protected and cannot be disabled.' });
    }

    await User.findByIdAndUpdate(userId, { status: 'DISABLED' });
    res.json({ message: 'User account has been disabled' });
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

/**
 * Update Push Token
 */
exports.savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!pushToken) return res.status(400).json({ message: 'Token required' });

    await User.findByIdAndUpdate(userId, { pushToken });
    res.json({ message: 'Push token updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Profile (Name & Username)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, username } = req.body;
    const userId = req.session.userId;

    console.log('📝 Update Profile Request:', { userId, name, username });

    if (!userId) {
      console.log('❌ Update failed: Unauthorized (No userId in session)');
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    // If username is changing, check for uniqueness
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) {
        console.log('❌ Update failed: Username already taken:', username);
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { name, username }, 
      { new: true }
    );

    if (!updatedUser) {
      console.log('❌ Update failed: User not found in DB');
      return res.status(404).json({ message: 'User record not found' });
    }

    console.log('✅ Profile updated successfully for:', updatedUser.email);
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
