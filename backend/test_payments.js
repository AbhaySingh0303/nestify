const { MongoClient } = require('mongodb');
const fs = require('fs');
const uri = "mongodb+srv://abhaysingh5205:Abhay5205%40@abhay.uu1xcgl.mongodb.net/nestify?appName=abhay";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('nestify');
    const payments = await database.collection('payments').find({}).toArray();
    fs.writeFileSync('payments_dump.json', JSON.stringify(payments, null, 2));
    
    const tenants = await database.collection('tenants').find({}).toArray();
    fs.writeFileSync('tenants_dump.json', JSON.stringify(tenants, null, 2));
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
