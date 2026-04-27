// calculateHours.js
// Calculates how many hours an employee
// has worked in the current week.
//
// This is used for the smart notification
// system. When a manager creates a new shift
// we only notify employees who have worked
// less than 40 hours this week.
//
// Employees who already worked 40 hours
// do not get notified about new shifts.
// This follows German labor law guidelines.

const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");

// getCurrentWeekBounds - returns the start and end of the current week
// Week goes from Monday 00:00:00 to Sunday 23:59:59
// Used internally by getWeeklyMinutes
function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// getWeeklyMinutes - gets total minutes worked this week by one employee
// Looks at all checked-out attendance records for shifts that started this week
// and adds up the totalWorkMinutes field.
//
// employeeId - the ID of the employee to check
// Returns the total minutes worked as a number (0 if none)
async function getWeeklyMinutes(employeeId) {
  const eid =
    typeof employeeId === "string"
      ? new mongoose.Types.ObjectId(employeeId)
      : employeeId;
  const { start, end } = getCurrentWeekBounds();

  const result = await Attendance.aggregate([
    {
      $match: {
        employee: eid,
        status: "checked_out",
      },
    },
    {
      $lookup: {
        from: "shifts",
        localField: "shift",
        foreignField: "_id",
        as: "shiftDoc",
      },
    },
    { $unwind: "$shiftDoc" },
    {
      $match: {
        "shiftDoc.shiftStartTime": { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: "$totalWorkMinutes" },
      },
    },
  ]);

  return result[0]?.totalMinutes ?? 0;
}

// isBelowWeeklyLimit - checks if employee has worked less than 40 hours this week
// Used to decide if the employee should be notified about a new shift.
// Returns true if they are below the limit (should be notified)
// Returns false if they are at or above the limit (do not notify)
//
// employeeId - the ID of the employee to check
// limitHours - the hour limit to check against (default is 40)
async function isBelowWeeklyLimit(employeeId, limitHours = 40) {
  const worked = await getWeeklyMinutes(employeeId);
  const limitMinutes = limitHours * 60;
  return worked < limitMinutes;
}

module.exports = {
  getWeeklyMinutes,
  isBelowWeeklyLimit,
  getCurrentWeekBounds,
};
