const mongoose = require('mongoose');
const URI = 'mongodb+srv://niveshgajengi_db_user:0gVwvxdK7ms@cluster0.lahyqrp.mongodb.net/?appName=Cluster0';

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(URI);
    const db = mongoose.connection.db;
    
    // List of collections to clear
    const collections = ['loans', 'credit_profiles', 'merchants', 'transactions', 'orders'];
    
    for (const colName of collections) {
      const collection = db.collection(colName);
      const result = await collection.deleteMany({});
      console.log(`Cleared ${result.deletedCount} documents from ${colName}`);
    }
    
    console.log('Full Database cleanup complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error clearing database:', err);
  }
}

clearDatabase();
