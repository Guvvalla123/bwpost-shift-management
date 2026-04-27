// cronJobs.js
// This file starts all scheduled background
// jobs when the server starts.
//
// WHAT ARE CRON JOBS:
// Cron jobs are tasks that run automatically
// on a schedule without anyone clicking anything.
// Like an alarm clock for code.
//
// CURRENT SCHEDULED JOBS:
//
// 1. Auto Checkout Job
//    Runs every 10 minutes
//    Checks out employees who forgot
//    to check out after shift ended
//
// HOW TO ADD MORE JOBS IN FUTURE:
// 1. Create a new file in cron/ folder
// 2. Import it here
// 3. Call it inside startAllCronJobs()
//
// HOW TO USE:
// This function is called in server.js
// after the database connects successfully
// const { startAllCronJobs } = require("./cron/cronJobs");
// startAllCronJobs();

const cron = require("node-cron");
const { runAutoCheckoutJob } = require("./autoCheckout");

// Guard flag so the jobs are never registered twice
// (e.g. if the database reconnects and fires the event again)
let jobsStarted = false;

// startAllCronJobs - starts all cron jobs
// Called once when server starts
// Only starts after database is connected
function startAllCronJobs() {
  // If jobs are already running do nothing
  // This prevents duplicate schedules on reconnect
  if (jobsStarted) {
    return;
  }
  jobsStarted = true;

  console.log("Starting all scheduled jobs...");

  // Start the auto checkout job
  // Runs every 10 minutes ("*/10 * * * *")
  // Automatically checks out employees who forgot after shift ended
  cron.schedule("*/10 * * * *", () => {
    runAutoCheckoutJob();
  });

  console.log("All scheduled jobs started.");
  console.log("Cron jobs initialized (auto checkout every 10 minutes)");
}

module.exports = { startAllCronJobs };
