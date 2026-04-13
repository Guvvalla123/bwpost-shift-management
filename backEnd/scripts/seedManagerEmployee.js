/**
 * Seed script: Create one Manager and one Employee for development/testing.
 * New users: plain-text passwords → User.create() → Mongoose pre-save hashes once.
 * Existing users: password reset via raw MongoDB update (bypasses pre-save, avoids double-hash).
 *
 * Usage: npm run seed:dev   (from backEnd/)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

const MANAGER_EMAIL = "manager@bwpost.de";
const EMPLOYEE_EMAIL = "employee@bwpost.de";

async function seedManagerEmployee() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required. Add it to your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const usersCol = mongoose.connection.db.collection("users");

    let manager = await User.findOne({ email: MANAGER_EMAIL });
    if (manager) {
      console.log("Manager already exists — verifying password...");
      const correctHash = await bcrypt.hash("Manager@123!", 12);
      await usersCol.updateOne(
        { email: MANAGER_EMAIL },
        { $set: { password: correctHash } }
      );
      console.log("Manager password verified and reset");
    } else {
      manager = await User.create({
        username: "BWPostManager",
        email: MANAGER_EMAIL,
        password: "Manager@123!",
        role: "manager",
        isActive: true,
      });
      console.log("Manager created");
    }

    const employeeExists = await User.findOne({ email: EMPLOYEE_EMAIL });
    if (employeeExists) {
      console.log("Employee already exists — verifying password...");
      const correctHash = await bcrypt.hash("Employee@123!", 12);
      await usersCol.updateOne(
        { email: EMPLOYEE_EMAIL },
        { $set: { password: correctHash } }
      );
      console.log("Employee password verified and reset");
    } else {
      const mgr = await User.findOne({ email: MANAGER_EMAIL });
      if (!mgr) {
        console.error("Cannot create employee: no manager record for", MANAGER_EMAIL);
        process.exit(1);
      }
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
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedManagerEmployee();
