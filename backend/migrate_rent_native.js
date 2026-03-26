const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    // We explicitly request rentPrice bypassing schema if it was removed, or just use the model
    // Actually if rentPrice was removed from schema, we must query loosely
    const db = mongoose.connection.db;
    const roomsCollection = db.collection('rooms');
    const rooms = await roomsCollection.find({}).toArray();
    
    let count = 0;
    for (let room of rooms) {
      const oldRent = room.rentPrice;
      const newRent = room.rent;

      if (oldRent !== undefined && newRent === undefined) {
        await roomsCollection.updateOne({ _id: room._id }, { $set: { rent: oldRent }, $unset: { rentPrice: "" } });
        count++;
      } else if (!newRent || newRent === 0) {
        // give it a default rent if everything is missing so it doesn't break
        await roomsCollection.updateOne({ _id: room._id }, { $set: { rent: oldRent || 5000 } });
        count++;
      }
    }
    
    console.log(`Migrated ${count} rooms gracefully.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

migrate();
