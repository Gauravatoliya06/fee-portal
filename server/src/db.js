import mongoose from 'mongoose';
import { User } from './models/index.js';
import { runSeed } from './seed.js';

let mongodInstance = null;
let dbInfo = { type: 'unknown', uri: '' };

export function getDbInfo() {
  return dbInfo;
}

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fee_portal';
  let connected = false;

  // 1. Try external / local MongoDB instance
  try {
    console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/[^@]*@/, '//***@')} ...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log('✓ Connected to MongoDB database.');
    dbInfo = { type: 'external', uri: uri.split('@').pop() };
    connected = true;
  } catch (err) {
    console.warn(`External MongoDB connection failed (${err.message}). Starting embedded MongoDB...`);
  }

  // 2. Fallback to embedded in-memory MongoDB
  if (!connected) {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: { dbName: 'fee_portal' },
      });
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri);
      console.log(`✓ Connected to Embedded In-Memory MongoDB: ${memUri}`);
      dbInfo = { type: 'embedded', uri: memUri };
      connected = true;
    } catch (memErr) {
      console.error('Fatal: Could not connect to external or embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }

  // 3. Auto-seed if database is brand new (0 users)
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('ℹ Database is empty. Seeding initial admin and demo student records...');
      await runSeed({ demo: true });
    }
  } catch (seedErr) {
    console.error('Initial auto-seed check error:', seedErr.message);
  }

  return dbInfo;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}
