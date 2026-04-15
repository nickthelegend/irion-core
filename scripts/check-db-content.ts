import mongoose from 'mongoose';
import { Pool } from '../lib/db/models/pool.model';

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDB() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const latest = await Pool.find().sort({ timestamp: -1 }).limit(5);
  console.log('Latest Pool entries:', JSON.stringify(latest, null, 2));
  
  process.exit(0);
}

checkDB();
