// seedAdmin.js
// Creates the first admin user in MongoDB when none exists yet.
//
// WHAT IT DOES:
// 1. Loads environment variables (.env beside this folder).
// 2. Connects to MongoDB via MONGO_URI.
// 3. Looks for admin@bwpost-new.com (or SEED_ADMIN_EMAIL).
// 4. Creates the admin if missing; otherwise skips.
//
// WHEN TO RUN:
//   npm run seed:admin   (from backEnd-new/)
//
// DEFAULT ACCOUNT (unless overridden in .env):
//   username: AdminUser
//   email:    admin@bwpost-new.com
//   password: NewAdmin@2024!
//   role:     admin

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@bwpost-new.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "NewAdmin@2024!";
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || "AdminUser";

async function seedAdmin() {
  // Required connection string guard
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required in .env");
    process.exit(1);
  }

  try {
    // Open database connection once for this CLI run
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("Admin already exists:", ADMIN_EMAIL);
      process.exit(0);
      return;
    }

    await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      isActive: true,
    });

    console.log("Admin user created:");
    console.log("Email:", ADMIN_EMAIL);
    console.log("Username:", ADMIN_USERNAME);
    console.log("Password: (see SEED_ADMIN_PASSWORD or default NewAdmin@2024!)");
    process.exit(0);
  } catch (error) {
    console.error("seed:admin failed:", error.message);
    process.exit(1);
  }
}

seedAdmin();
