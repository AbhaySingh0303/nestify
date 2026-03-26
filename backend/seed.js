require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Room = require('./models/Room');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Room.deleteMany();

    const hashedPassword = await bcrypt.hash('123456', 10);
    const users = await User.insertMany([
      { name: 'Admin', email: 'admin@nestify.com', password: hashedPassword, role: 'admin' },
      { name: 'Test Tenant', email: 'tenant@nestify.com', password: hashedPassword, role: 'tenant' }
    ]);

    const rooms = await Room.insertMany([
      { roomNumber: '101', capacity: 2, rent: 5000, amenities: ['AC', 'WiFi'] },
      { roomNumber: '102', capacity: 3, rent: 4000, amenities: ['WiFi'] },
      { roomNumber: '201', capacity: 1, rent: 8000, amenities: ['AC', 'WiFi', 'Attached Bathroom'] },
    ]);

    console.log('Data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
