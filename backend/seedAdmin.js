const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'hafezzargar987@gmail.com';
    const adminPassword = 'Hafiz7865#';

    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log('Admin already exists, updating password and status...');
      admin.password = await bcrypt.hash(adminPassword, 10);
      admin.isAdmin = true;
      admin.status = 'APPROVED';
      admin.isRegistered = true;
      await admin.save();
    } else {
      console.log('Creating new Super Admin...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = new User({
        name: 'Super Admin',
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        status: 'APPROVED',
        isRegistered: true,
        isTermsAccepted: true
      });
      await admin.save();
    }

    console.log('Super Admin seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
