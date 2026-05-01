// calculateWeeklyHours.js
// Calculates how many hours an employee
// worked in the current week (Mon to Sun).
//
// WHY WE NEED THIS:
// When a manager creates a new shift
// we only notify employees who worked
// less than 40 hours this week.
// Employees at 40 hours are not notified.
// This follows German labor law guidelines.

const Attendance = require("../models/Attendance");

// Helper: Monday 00:00:00 local time for "now"
function startOfWeekMonday(now) {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: Sunday 23:59:59.999 local after that Monday
function endOfWeekSunday(startMonday) {
  const d = new Date(startMonday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

// getWeeklyMinutes - gets total minutes worked
// this week by one specific employee
// employeeId - the ID of the employee to check
// Returns a number (total minutes)
async function getWeeklyMinutes(employeeId) {
  const now = new Date();
  // Get the start of this week (Monday at midnight)
  const weekStart = startOfWeekMonday(now);
  // Get the end of this week (Sunday at 11:59pm)
  const weekEnd = endOfWeekSunday(weekStart);

  // Find attendance records for this employee
  // where they checked out this week
  const list = await Attendance.find({
    employee: employeeId,
    status: "checked_out",
    checkOut: { $gte: weekStart, $lte: weekEnd },
  }).select("totalWorkMinutes");

  // Add up all totalWorkMinutes values
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    total += list[i].totalWorkMinutes || 0;
  }
  // Return the total
  return total;
}

// isBelow40Hours - checks if employee is
// still below the 40 hour weekly limit
// Returns true if they can still work more
// Returns false if they are at the limit
// employeeId - the ID of the employee to check
async function isBelow40Hours(employeeId) {
  // 40 hours = 2400 minutes
  const WEEKLY_LIMIT_MINUTES = 2400;
  // Get how many minutes they worked this week
  const minutesWorked = await getWeeklyMinutes(employeeId);
  // Return true if they are below the limit
  return minutesWorked < WEEKLY_LIMIT_MINUTES;
}

module.exports = { getWeeklyMinutes, isBelow40Hours };
