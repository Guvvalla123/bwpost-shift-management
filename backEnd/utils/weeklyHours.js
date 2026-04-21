const mongoose = require("mongoose");
const Attendance = require("../models/attendanceModel");

/**
 * Monday 00:00:00 through Sunday 23:59:59.999 in the local server timezone.
 */
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

/**
 * Sum totalWorkMinutes for checked-out attendance rows whose shift starts this week.
 */
async function getWeeklyMinutesForEmployee(employeeId) {
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

/**
 * Whether the employee's weekly minutes are strictly below the configured hour cap.
 */
async function isEmployeeBelowWeeklyLimit(employeeId, limitHours = 40) {
  const worked = await getWeeklyMinutesForEmployee(employeeId);
  const limitMinutes = limitHours * 60;
  return worked < limitMinutes;
}

module.exports = {
  getWeeklyMinutesForEmployee,
  isEmployeeBelowWeeklyLimit,
  getCurrentWeekBounds,
};
