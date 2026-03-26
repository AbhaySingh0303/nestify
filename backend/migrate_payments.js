const { MongoClient, ObjectId } = require('mongodb');
const uri = "mongodb+srv://abhaysingh5205:Abhay5205%40@abhay.uu1xcgl.mongodb.net/nestify?appName=abhay";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('nestify');
    const payments = database.collection('payments');
    
    // Fix the specific payment
    await payments.updateOne(
      { _id: new ObjectId("69c01b6ba9b0e7e76c3668ee") },
      { $set: { 
          user: new ObjectId("69c01b6aa9b0e7e76c3668df"), // user id from the first tenant dump
          pg: new ObjectId("69c02d117478006f4e50a20a")    // pg id from the second tenant dump 
        } 
      }
    );
    console.log("Fixed the legacy payment document.");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
