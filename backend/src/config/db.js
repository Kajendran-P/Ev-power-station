const mongoose = require('mongoose');

let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, reuse
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
      .then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        console.log(`📊 Database: ${m.connection.name}`);
        return m;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
