// autoCheckout.js
// This is a scheduled job that runs
// every 10 minutes automatically.
//
// THE PROBLEM IT SOLVES:
// Sometimes employees forget to check out
// when their shift ends.
// This job finds them and checks them out.
//
// HOW IT WORKS:
// 1. Finds all shifts that have ended
// 2. For each ended shift finds employees
//    who are still checked in
// 3. Automatically checks them out
// 4. Sets checkout time to shift end time
// 5. Marks record as autoCheckout = true
// 6. Creates a notification for the employee
//
// SCHEDULE: "*/10 * * * *"

// Scheduler
const cron = require("node-cron");

const Shift = require("../models/Shift");

const Attendance = require("../models/Attendance");

const Notification = require("../models/Notification");

// Core worker invoked by cron tick
async function runAutoCheckout() {
  try {
    const now = new Date();

    const endedShifts = await Shift.find({
      shiftEndTime: { $lt: now },
    });

    if (endedShifts.length === 0) {
      return;
    }

    for (let i = 0; i < endedShifts.length; i++) {
      const shift = endedShifts[i];

      const stuckAttendances = await Attendance.find({
        shift: shift._id,
        status: { $in: ["checked_in", "on_break"] },
      });

      for (let j = 0; j < stuckAttendances.length; j++) {
        const attendance = stuckAttendances[j];

        const checkOutTime = new Date(shift.shiftEndTime);

        // If still mid-break close the dangling segment
        if (attendance.status === "on_break") {
          const lastBreak =
            attendance.breaks[
              attendance.breaks.length - 1
            ];
          if (
            lastBreak &&
            !lastBreak.end
          ) {
            lastBreak.end = checkOutTime;
          }
        }

        const checkInTime = new Date(
          attendance.checkIn
        );

        let totalWorkMinutes = Math.floor(
          (checkOutTime - checkInTime) /
            (1000 * 60)
        );

        // Guard against bogus negative math
        if (totalWorkMinutes < 0) {
          totalWorkMinutes = 0;
        }

        attendance.status = "checked_out";
        attendance.checkOut = checkOutTime;
        attendance.totalWorkMinutes =
          totalWorkMinutes;
        attendance.autoCheckout = true;

        await attendance.save();

        await Notification.create({
          recipient: attendance.employee,
          message:
            "You were automatically checked out " +
            "of shift: " +
            shift.shiftTitle +
            ". Please check your attendance.",
          type: "auto_checkout",
          relatedShift: shift._id,
        });

        console.log(
          "Auto checkout:",
          attendance.employee.toString(),
          "shift:",
          shift.shiftTitle
        );
      }
    }
  } catch (error) {
    console.log(
      "Auto checkout error:",
      error.message
    );
  }
}

// Called once during server bootstrap
function startAutoCheckoutJob() {
  cron.schedule("*/10 * * * *", function () {
    console.log(
      "Running auto checkout job..."
    );
    runAutoCheckout().catch(function (err) {
      console.log(
        "Auto checkout promise error:",
        err.message
      );
    });
  });

  console.log("Auto checkout job scheduled");
}

module.exports = {
  startAutoCheckoutJob,
};
