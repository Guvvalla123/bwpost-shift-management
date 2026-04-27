// autoCheckout.js
// This file handles automatic checkout
// for employees who forgot to check out.
//
// THE PROBLEM IT SOLVES:
// Sometimes employees forget to check out
// at the end of their shift.
// Without auto checkout their attendance
// record stays as "checked_in" forever.
// This causes wrong hours calculations.
//
// HOW IT WORKS:
// 1. Every 10 minutes the job runs
// 2. It finds all attendance records
//    where status is still "checked_in"
// 3. For each record it checks if the
//    shift end time has already passed
// 4. If yes it automatically checks out
//    the employee
// 5. Sets checkout time to shift end time
// 6. Marks autoCheckout as true so manager
//    knows it was done automatically
// 7. Recalculates total hours worked
// 8. Sends a notification to the employee
//    saying they were auto checked out
//
// HOW TO EXPLAIN IN INTERVIEW:
// "We use node-cron to run a scheduled
//  job every 10 minutes. It checks if any
//  employees are still marked as checked in
//  but their shift has already ended.
//  If so it automatically checks them out
//  and notifies them via the notification bell."

const Attendance = require("../models/Attendance");
const Shift = require("../models/Shift");
const { createNotification } = require("../controllers/notificationController");
const { autoCheckoutAttendanceRecord } = require("../controllers/attendanceController");

// runAutoCheckoutJob - the main auto checkout function
// This is called by the cron schedule every 10 minutes
// It scans for forgotten checkouts and processes each one
async function runAutoCheckoutJob() {
  // Get current time to compare with shift end times
  const now = new Date();

  // Track how many employees were successfully auto checked out this run
  let processed = 0;

  try {
    // Find all attendance records where employee is still checked in
    // (status = "checked_in") and the shift has already ended.
    // We use an aggregation pipeline to join attendance with the shift
    // so we can filter by shift end time in a single database query.
    const candidates = await Attendance.aggregate([
      { $match: { status: "checked_in", autoCheckout: { $ne: true } } },
      {
        $lookup: {
          from: "shifts",
          localField: "shift",
          foreignField: "_id",
          as: "s",
        },
      },
      { $unwind: "$s" },
      // Only include records where the shift end time is in the past
      { $match: { "s.shiftEndTime": { $lt: now } } },
    ]);

    // Loop through each employee who forgot to check out and process them one by one
    for (const row of candidates) {
      try {
        // Re-fetch the attendance record fresh from the database to avoid
        // race conditions where another request already checked them out
        const att = await Attendance.findById(row._id);

        // Skip this record if it was already processed by another request
        // or if the status has changed since we ran the query above
        if (!att || att.autoCheckout || att.status !== "checked_in") {
          continue;
        }

        // Re-fetch the shift to double check end time is still in the past
        const shift = await Shift.findById(att.shift);

        // Skip if shift no longer exists or end time has not yet passed
        if (!shift || new Date(shift.shiftEndTime) >= now) {
          continue;
        }

        // Call the shared checkout helper which sets checkout time,
        // calculates total minutes worked, and saves the attendance record
        const result = await autoCheckoutAttendanceRecord(att, shift);

        // Skip if the helper decided this record should not be processed
        if (result.skipped) {
          continue;
        }

        // Count this as a successful auto checkout
        processed += 1;

        // Format the shift end time as a readable time string
        // for the notification message (e.g. "5:00 PM")
        const shiftEnd = new Date(shift.shiftEndTime);
        const timeLabel = shiftEnd.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        // Build the notification message that the employee will see
        // in their notification bell on the frontend
        const msg = `Shift "${shift.shiftTitle}": you were checked out at ${timeLabel}.`;

        // Send a notification to the employee telling them they were
        // automatically checked out because they forgot to do it
        await createNotification(
          att.employee,
          "auto_checkout",
          "You were automatically checked out",
          msg,
          shift._id
        );
      } catch (err) {
        // If one employee record fails do not stop the whole job
        // Log the error and continue to the next employee
        console.error("[cron:autoCheckout] row error:", row._id?.toString?.(), err.message);
      }
    }

    // Log summary of this run so you can monitor the job in server logs
    if (processed === 0 && candidates.length === 0) {
      console.log("[cron:autoCheckout] No employees required auto checkout (0 candidates).");
    } else {
      console.log(
        `[cron:autoCheckout] Completed. Employees auto checked out this run: ${processed} (candidates scanned: ${candidates.length}).`
      );
    }
  } catch (err) {
    // Log the error if the whole job fails (e.g. database is down)
    console.error("[cron:autoCheckout] Job failed:", err.message);
  }
}

module.exports = { runAutoCheckoutJob };
