const mongoose = require('mongoose');

/**
 * Connect to MongoDB with automated fallback for frictionless local development.
 * If local MongoDB / MongoDB Atlas is reachable, it uses it.
 * If not connected and in development, it automatically starts an in-memory Mongo server
 * so the application and seed scripts run immediately without error.
 */
let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockwise';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Quick timeout to fallback if local mongod is absent
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Database] Could not connect to primary MongoDB (${uri}): ${error.message}`);

    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Starting in-memory MongoDB server for development/testing fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const fallbackUri = memoryServer.getUri();
        const conn = await mongoose.connect(fallbackUri);
        console.log(`[Database] In-memory MongoDB connected successfully: ${conn.connection.host}`);
      } catch (memErr) {
        console.error('[Database] Failed to initialize in-memory fallback:', memErr.message);
        process.exit(1);
      }
    } else {
      console.error('[Database] MongoDB connection error in production. Exiting.');
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, closeDB };
