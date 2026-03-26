const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://abhaysingh5205:Abhay5205%40@abhay.uu1xcgl.mongodb.net/nestify?appName=abhay');
  const db = mongoose.connection.db;
  
  try {
    await db.collection('rooms').dropIndex('roomNumber_1');
    console.log("Dropped roomNumber_1 global index");
  } catch (e) {
    console.log("Index might not exist or already dropped: ", e.message);
  }

  try {
    const result = await db.collection('rooms').updateMany(
      { pg: { $exists: true } }, 
      [{ $set: { pgId: "$pg" } }, { $unset: "pg" }]
    );
    console.log(`Migrated ${result.modifiedCount} rooms from pg to pgId natively`);
  } catch (e) {
    console.log("Migration failed: ", e.message);
  }
  
  process.exit(0);
}
run();
