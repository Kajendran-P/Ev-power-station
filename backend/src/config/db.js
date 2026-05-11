const mongoose = require('mongoose');

// Global cache to persist connection across Vercel serverless invocations
const MONGODB_URI = () => process.env.MONGO_URI;

let cached = global.__mongoose_cache__;
if (!cached) {
  cached = global.__mongoose_cache__ = { conn: null, promise: null };
}

async function connectDB() {
  // Already connected — return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset if connection was lost
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  // Start new connection if none in progress
  if (!cached.promise) {
    const uri = MONGODB_URI();
    if (!uri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    console.log('🔄 MongoDB: Initiating connection...');
    cached.promise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    }).then((mongooseInstance) => {
      console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
      console.log(`📊 Database: ${mongooseInstance.connection.name}`);
      cached.conn = mongooseInstance;
      return mongooseInstance;
    }).catch((err) => {
      console.error(`❌ MongoDB Connection Failed: ${err.message}`);
      // Reset so next request retries
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }

  // Wait for the in-progress connection
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
