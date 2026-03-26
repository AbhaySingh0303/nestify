const mongoose = require('mongoose');

async function migrate() {
  try {
    await mongoose.connect('mongodb+srv://abhaysingh5205:Abhay5205%40@abhay.uu1xcgl.mongodb.net/nestify?appName=abhay');
    console.log("Connected to DB");
    const db = mongoose.connection.db;
    const roomsCollection = db.collection('rooms');
    const rooms = await roomsCollection.find({}).toArray();
    let count = 0;
    for (let room of rooms) {
      if (room.rentPrice !== undefined && room.rent === undefined) {
        await roomsCollection.updateOne({ _id: room._id }, { $set: { rent: room.rentPrice }, $unset: { rentPrice: "" } });
        count++;
      } else if (!room.rent || room.rent === 0) {
        await roomsCollection.updateOne({ _id: room._id }, { $set: { rent: room.rentPrice || 5000 } });
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
