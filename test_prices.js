require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
(async () => {
  const client = await MongoClient.connect(uri);
  const db = client.db();
  const docs = await db.collection("products").find({ price: { $in: [588, 614, 662] }, product_source: "competitor" }).toArray();
  console.log("Competitor Docs with 588, 614, 662:", docs.length);
  const sdocs = await db.collection("products").find({ cost: { $in: [588, 614, 662] }, product_source: { $ne: "competitor" } }).toArray();
  console.log("Supplier Docs with 588, 614, 662:", sdocs.length);
  await client.close();
})();
