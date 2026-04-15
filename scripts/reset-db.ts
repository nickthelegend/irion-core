import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment. Make sure to run with --env-file=.env.local');
  process.exit(1);
}

async function resetDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.');

    // We use the collection names directly to avoid needing to import and register all models
    const collections = ['pools', 'loans', 'transactions', 'users', 'merchants'];
    
    for (const name of collections) {
      console.log(`Clearing collection: ${name}...`);
      try {
        const result = await mongoose.connection.collection(name).deleteMany({});
        console.log(`  Done. Deleted ${result.deletedCount} documents.`);
      } catch (err: any) {
        if (err.code === 26) {
            console.log(`  Collection ${name} does not exist, skipping.`);
        } else {
            console.warn(`  Warning: Could not clear ${name}:`, err.message);
        }
      }
    }

    console.log('\nDatabase reset complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

resetDB();
