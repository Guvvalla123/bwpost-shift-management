/**
 * Seed script: Create initial Admin user
 * Run once to bootstrap the system when no admin exists.
 *
 * Usage: npm run seed:admin   (from backEnd/)
 *
 * Development: optional env vars fall back to local defaults (change them for your machine).
 * Production:  set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD explicitly — defaults are blocked.
 *
 *   SEED_ADMIN_EMAIL=admin@yourcompany.com
 *   SEED_ADMIN_PASSWORD=<strong-unique-password>
 *   SEED_ADMIN_USERNAME=Admin
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/userModel");

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
