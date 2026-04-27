// seedAdmin.js
// This script creates the first admin account.
// Run this once when setting up the project for the first time.
//
// HOW TO RUN:
//   npm run seed:admin    (from the backEnd/ folder)
//
// WHAT IT DOES:
// - Reads admin credentials from the .env file
// - Creates an admin account if one does not already exist
// - If an admin with that email already exists, it does nothing
//
// .env VARIABLES USED:
//   SEED_ADMIN_EMAIL     — the email for the admin account
//   SEED_ADMIN_PASSWORD  — the password for the admin account
//   SEED_ADMIN_USERNAME  — the display name for the admin account
//
// AFTER RUNNING:
// 1. Log in with the admin account
// 2. Use the Admin panel to create invite links
// 3. Send invite links to managers and employees
//
// IMPORTANT:
// In production, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD
// must be set explicitly in the .env file.
// The script will refuse to run in production without them.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const isProd = process.env.NODE_ENV === "production";
if (isProd && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)) {
  console.error(
    "In NODE_ENV=production, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must both be set (no built-in defaults)."
  );
  process.exit(1);
}

const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@bwpost.com";
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123!";
const SEED_USERNAME = process.env.SEED_ADMIN_USERNAME || "Admin";

async function seedAdmin() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required. Add it to your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: SEED_EMAIL });
    if (existing) {
      console.log(`Admin already exists: ${SEED_EMAIL}`);
      console.log("No changes made. Use Login with this email.");
      process.exit(0);
      return;
    }

    await User.create({
      username: SEED_USERNAME,
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      role: "admin",
    });

    console.log("\n✅ Initial Admin created successfully!\n");
    console.log("  Email:    ", SEED_EMAIL);
    if (!isProd) {
      console.log("  Password: ", SEED_PASSWORD, "(dev default — rotate if shared)");
    } else {
      console.log("  Password:  (set via SEED_ADMIN_PASSWORD — not printed in production)");
    }
    console.log("\n  → Sign in, then use Admin UI to create invite links for Managers and Employees.\n");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedAdmin();
