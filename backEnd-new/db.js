// db.js
// This file connects our server to MongoDB.
// We call connectDB in server.js
// before starting the server.
// If connection fails the process exits.

const mongoose = require("mongoose");

// connectDB - connects to MongoDB database
// Uses MONGO_URI from the .env file
// Logs success or exits on failure
async function connectDB() {
  try {
    // Connect to MongoDB using the URI from .env
    await mongoose.connect(process.env.MONGO_URI);
    // Log success message
    console.log("MongoDB connected successfully");
  } catch (error) {
    // Log the error and stop the server
    console.log("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
