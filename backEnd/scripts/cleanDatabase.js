require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

async function clean() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const users = await db.collection("users").find({}).toArray();
  console.log("ALL USERS BEFORE CLEANUP:");
  users.forEach(u => console.log(" ", u.role.padEnd(10), u.email));

  const keep = [
    "admin@bwpost.com",
    "manager@bwpost.de",
    "employee@bwpost.de",
  ];

  const deleted = await db.collection("users").deleteMany({
    role: { $ne: "admin" },
    email: { $nin: keep }
  });

  await db.collection("shifts").deleteMany({});
  await db.collection("shiftrequests").deleteMany({});
  await db.collection("attendances").deleteMany({});
  await db.collection("invites").deleteMany({});
  await db.collection("auditlogs").deleteMany({});

  const managerHash = await bcrypt.hash("Manager@123!", 12);
  const employeeHash = await bcrypt.hash("Employee@123!", 12);

  await db.collection("users").updateOne(
    { email: "manager@bwpost.de" },
    { $set: { password: managerHash } }
  );

  await db.collection("users").updateOne(
    { email: "employee@bwpost.de" },
    { $set: { password: employeeHash } }
  );

  console.log("Seed user passwords reset correctly");

  const remaining = await db.collection("users")
    .find({}, { projection: { email: 1, role: 1, username: 1, _id: 0 } })
    .toArray();

  console.log("");
  console.log("══════════════════════════════");
  console.log("CLEANUP COMPLETE");
  console.log("══════════════════════════════");
  console.log("Users deleted:  ", deleted.deletedCount);
  console.log("Remaining users:", remaining.length);
  remaining.forEach(u =>
    console.log(" ", u.role.padEnd(10), u.username.padEnd(20), u.email)
  );
  console.log("All other collections cleared.");
  console.log("══════════════════════════════");

  await mongoose.disconnect();
  process.exit(0);
}

clean().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
