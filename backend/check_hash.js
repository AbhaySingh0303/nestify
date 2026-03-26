const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = await User.findOne({ email: 'admin@nestify.com' });
  const match = await bcrypt.compare('123456', admin.password);
  console.log("Does 123456 match?", match);
  mongoose.connection.close();
}
test();
