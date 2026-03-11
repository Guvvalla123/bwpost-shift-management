const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }
    console.error('All MongoDB connection attempts failed. Exiting.');
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Mongoose will auto-reconnect.');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

module.exports = connectDB;
