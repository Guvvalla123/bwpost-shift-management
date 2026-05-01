// seedData.js
// Creates or resets the standard manager + employee test accounts.
//
// WHAT IT DOES:
// 1. Connects using MONGO_URI.
// 2. Ensures manager@bwpost-new.de exists with username "ManagerUser"
//       and resets password hash to NewManager@2024!
//       if record already existed.
// 3. Ensures employee@bwpost-new.de exists with username "EmployeeUser",
//       managerId linking to manager, password NewEmployee@2024!
//       resetting hash when rerunning seeds.
//
// WHEN TO RUN:
//   npm run seed:dev    (after seed:admin, from backEnd-new/)

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const User = require("../models/User");

const MANAGER_EMAIL = "manager@bwpost-new.de";
const EMPLOYEE_EMAIL = "employee@bwpost-new.de";
const MANAGER_USERNAME = "ManagerUser";
const EMPLOYEE_USERNAME = "EmployeeUser";
const MANAGER_PASSWORD = "NewManager@2024!";
const EMPLOYEE_PASSWORD = "NewEmployee@2024!";

async function seedData() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const usersCol = mongoose.connection.db.collection("users");
    const managerHash = await bcryptjs.hash(MANAGER_PASSWORD, 10);
    const employeeHash = await bcryptjs.hash(EMPLOYEE_PASSWORD, 10);

    let manager = await User.findOne({ email: MANAGER_EMAIL });

    if (!manager) {
      manager = await User.create({
        username: MANAGER_USERNAME,
        email: MANAGER_EMAIL,
        password: MANAGER_PASSWORD,
        role: "manager",
        isActive: true,
      });
      console.log("Manager created:", MANAGER_EMAIL);
    } else {
      await usersCol.updateOne(
        { email: MANAGER_EMAIL },
        {
          $set: {
            password: managerHash,
            username: MANAGER_USERNAME,
            role: "manager",
            isActive: true,
          },
        }
      );
      manager = await User.findOne({ email: MANAGER_EMAIL });
      console.log("Manager updated (password/username reset)");
    }

    const employeeAlready = await User.findOne({ email: EMPLOYEE_EMAIL });

    if (!employeeAlready) {
      const mgr = manager || (await User.findOne({ email: MANAGER_EMAIL }));
      if (!mgr) {
        console.error("Cannot seed employee — manager missing.");
        process.exit(1);
      }

      await User.create({
        username: EMPLOYEE_USERNAME,
        email: EMPLOYEE_EMAIL,
        password: EMPLOYEE_PASSWORD,
        role: "employee",
        managerId: mgr._id,
        isActive: true,
      });
      console.log("Employee created:", EMPLOYEE_EMAIL);
    } else {
      await usersCol.updateOne(
        { email: EMPLOYEE_EMAIL },
        {
          $set: {
            password: employeeHash,
            username: EMPLOYEE_USERNAME,
            role: "employee",
            managerId: manager._id,
            isActive: true,
          },
        }
      );
      console.log("Employee updated (password/username/managerId reset)");
    }

    console.log("Seed complete.");
    console.log("   Manager: ", MANAGER_EMAIL, "/", MANAGER_PASSWORD);
    console.log("   Employee:", EMPLOYEE_EMAIL, "/", EMPLOYEE_PASSWORD);
    process.exit(0);
  } catch (error) {
    console.error("seed:dev failed:", error.message);
    process.exit(1);
  }
}

seedData();
