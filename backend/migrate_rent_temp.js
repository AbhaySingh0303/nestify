const mongoose = require('mongoose');
require('dotenv').config();

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  occupied: { type: Number, default: 0 },
  rent: { type: Number, default: 0 },
  rentPrice: { type: Number },
  amenities: [{ type: String }],
  pg: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' }
}, { timestamps: true, strict: false });

const Room = mongoose.model('RoomTemp', roomSchema, 'rooms');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    const rooms = await Room.find({});
    let count = 0;
    for (let room of rooms) {
      let needsSave = false;
      if (room.get('rentPrice') && !room.get('rent')) {
        room.set('rent', room.get('rentPrice'));
        needsSave = true;
      }
      // Guarantee any $0 or undefined rent is at least populated from rentPrice or fixed
      if (!room.rent && room.rentPrice) {
        room.rent = room.rentPrice;
        needsSave = true;
      }

      if (needsSave) {
        await room.save();
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
