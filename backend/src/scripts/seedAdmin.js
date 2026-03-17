const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Employee = require('../models/Employee');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const adminEmail = 'admin@wms.com';
    const adminPassword = 'password123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists. Updating to verified status...');
      existingAdmin.accountStatus = 'verified';
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Admin updated.');
    } else {
      console.log('Creating new admin user...');
      const admin = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        accountStatus: 'verified',
        religion: 'None',
        religiousRestDay: 'None'
      });
      console.log('Admin user created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
