const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ email: 'admin@nestify.com' });
    if (!admin) {
      console.log('Admin user NOT FOUND.');
    } else {
      console.log('Admin found:', admin.email);
      console.log('Password hash starts with $2b$ or $2a$?', admin.password.startsWith('$2'));
      console.log('Exact password field:', admin.password);
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}
check();
