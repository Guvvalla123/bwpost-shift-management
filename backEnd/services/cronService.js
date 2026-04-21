const cron = require("node-cron");
const Attendance = require("../models/attendanceModel");
const Shift = require("../models/shiftModel");
const { createNotification } = require("./notificationService");
const { autoCheckoutAttendanceRecord } = require("./attendanceService");

let jobsStarted = false;

async function runAutoCheckoutJob() {
  const now = new Date();
  let processed = 0;

  try {
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
      { $match: { "s.shiftEndTime": { $lt: now } } },
    ]);

    for (const row of candidates) {
      try {
        const att = await Attendance.findById(row._id);
        if (!att || att.autoCheckout || att.status !== "checked_in") {
          continue;
        }
        const shift = await Shift.findById(att.shift);
        if (!shift || new Date(shift.shiftEndTime) >= now) {
          continue;
        }

        const result = await autoCheckoutAttendanceRecord(att, shift);
        if (result.skipped) {
          continue;
        }
        processed += 1;

        const shiftEnd = new Date(shift.shiftEndTime);
        const timeLabel = shiftEnd.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        const msg = `Shift "${shift.shiftTitle}": you were checked out at ${timeLabel}.`;

        await createNotification(
          att.employee,
          "auto_checkout",
          "You were automatically checked out",
          msg,
          shift._id
        );
      } catch (err) {
        console.error("[cron:autoCheckout] row error:", row._id?.toString?.(), err.message);
      }
    }

    if (processed === 0 && candidates.length === 0) {
      console.log("[cron:autoCheckout] No employees required auto checkout (0 candidates).");
    } else {
      console.log(
        `[cron:autoCheckout] Completed. Employees auto checked out this run: ${processed} (candidates scanned: ${candidates.length}).`
      );
    }
  } catch (err) {
    console.error("[cron:autoCheckout] Job failed:", err.message);
  }
}

function startCronJobs() {
  if (jobsStarted) {
    return;
  }
  jobsStarted = true;

  cron.schedule("*/10 * * * *", () => {
    runAutoCheckoutJob();
  });

  console.log("Cron jobs initialized (auto checkout every 10 minutes)");
}

module.exports = { startCronJobs, runAutoCheckoutJob };
