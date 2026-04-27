// seedData.js
// This script creates test accounts for development and testing.
//
// WHAT IT CREATES:
// Manager:  manager@bwpost.de / Manager@123!
// Employee: employee@bwpost.de / Employee@123!
//
// HOW TO RUN:
//   npm run seed:dev    (from the backEnd/ folder)
//
// WHAT IT DOES:
// - If the accounts do not exist yet, it creates them.
// - If the accounts already exist, it resets their passwords
//   back to the test credentials listed above.
// - The employee is linked to the manager automatically.
//
// IMPORTANT:
// Only use this in development — never run it in production.
// It creates accounts with known passwords that are not secure.

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

// Test account credentials
const MANAGER_EMAIL = "manager@bwpost.de";
const EMPLOYEE_EMAIL = "employee@bwpost.de";

async function seedData() {
  // Make sure MONGO_URI is set before trying to connect
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required. Add it to your .env file.");
    process.exit(1);
  }

  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get the raw users collection — needed for direct password updates
    // We bypass the Mongoose pre-save hook here to avoid double-hashing
    const usersCol = mongoose.connection.db.collection("users");

    // ── SEED MANAGER ──────────────────────────────────
    let manager = await User.findOne({ email: MANAGER_EMAIL });

    if (manager) {
      // Manager already exists — reset their password to the known test value
      console.log("Manager already exists — verifying password...");
      const correctHash = await bcrypt.hash("Manager@123!", 12);
      await usersCol.updateOne(
        { email: MANAGER_EMAIL },
        { $set: { password: correctHash } }
      );
      console.log("Manager password verified and reset");
    } else {
      // Manager does not exist — create them
      // Mongoose pre-save hook will hash the plain text password automatically
      manager = await User.create({
        username: "BWPostManager",
        email: MANAGER_EMAIL,
        password: "Manager@123!",
        role: "manager",
        isActive: true,
      });
      console.log("Manager created");
    }

    // ── SEED EMPLOYEE ─────────────────────────────────
    const employeeExists = await User.findOne({ email: EMPLOYEE_EMAIL });

    if (employeeExists) {
      // Employee already exists — reset their password to the known test value
      console.log("Employee already exists — verifying password...");
      const correctHash = await bcrypt.hash("Employee@123!", 12);
      await usersCol.updateOne(
        { email: EMPLOYEE_EMAIL },
        { $set: { password: correctHash } }
      );
      console.log("Employee password verified and reset");
    } else {
      // Employee does not exist — find the manager first to get their ID
      // (the employee must be linked to a manager)
      const mgr = await User.findOne({ email: MANAGER_EMAIL });
      if (!mgr) {
        console.error("Cannot create employee: no manager record for", MANAGER_EMAIL);
        process.exit(1);
      }

      // Create the employee and link them to the manager
      await User.create({
        username: "BWPostEmployee",
        email: EMPLOYEE_EMAIL,
        password: "Employee@123!",
        role: "employee",
        managerId: mgr._id,
        isActive: true,
      });
      console.log("Employee created");
    }

    // Print the test credentials to the console for easy copy-paste
    console.log("");
    console.log("══════════════════════════════════════");
    console.log("MANAGER CREDENTIALS");
    console.log("Email:    manager@bwpost.de");
    console.log("Password: Manager@123!");
    console.log("══════════════════════════════════════");
    console.log("EMPLOYEE CREDENTIALS");
    console.log("Email:    employee@bwpost.de");
    console.log("Password: Employee@123!");
    console.log("Manager:  BWPostManager");
    console.log("══════════════════════════════════════");
    console.log("");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    // Always close the database connection when done
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedData();
