const mongoose = require('mongoose');

let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection attempt is already in progress, wait for it
  if (!cached.promise) {
    console.log('🔄 Initiating new MongoDB connection...');

    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .then((m) => {
      console.log(`✅ MongoDB Connected: ${m.connection.host}`);
      console.log(`📊 Database: ${m.connection.name}`);
      return m;
    })
    .catch((error) => {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      cached.promise = null;
      cached.conn = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
