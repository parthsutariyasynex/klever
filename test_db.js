const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017/klever_dev"; // Or process.env.MONGODB_URI
async function run() {
  require('dotenv').config({ path: '.env.local' });
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/klever_dev");
  try {
    await client.connect();
    const db = client.db();
    const docs = await db.collection("products").find({ price: { $in: [588, 614, 662] }, product_source: "competitor" }).toArray();
    console.log("Found:", docs.length, "docs");
    if(docs.length > 0) {
        console.log("Values:", docs.map(d => ({ price: d.price, sku: d.sku, item_code: d.item_code, source_date: d.source_date })));
    }
  } finally {
    await client.close();
  }
}
run();
