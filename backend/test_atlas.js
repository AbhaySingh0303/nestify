const mongoose = require('mongoose');

async function test() {
  try {
    console.log("Connecting...");
    await mongoose.connect('mongodb+srv://abhaysingh5205:Abhay5205%40@abhay.uu1xcgl.mongodb.net/nestify?appName=abhay', { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully!");
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    mongoose.connection.close();
  }
}

test();
