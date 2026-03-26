const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/nestify_test');
    await User.deleteMany({});
    const user = await User.create({ name: 'Test', email: 'test@test.com', password: 'password123', role: 'admin' });
    console.log("Success:", user);
  } catch (error) {
    console.error("Error encountered:");
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

test();
