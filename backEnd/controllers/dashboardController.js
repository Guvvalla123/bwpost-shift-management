// dashboardController.js
// This file provides data for dashboards.
// Returns statistics and summary data.
//
// ROUTES:
// GET /api/manager/shifts/dashboard/data

const mongoose = require("mongoose");
const User = require("../models/User");
const Shift = require("../models/Shift");
const Attendance = require("../models/Attendance");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");

// getNextShiftLabel - converts a future date into a readable label
// Returns "Today", "Tomorrow", or "Next on [date]"
const getNextShiftLabel = (date) => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const diffDays = (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `Next on ${next.toLocaleDateString()}`;
};

// getDashboardData - gets all data needed for the manager dashboard
// Returns shift counts, attendance stats, and capacity info
// Used by the KPI cards and charts on the dashboard page
exports.getDashboardData = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;

  // Set up the start of today and tomorrow for attendance queries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // Convert userId string to ObjectId for use in aggregations
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Admin sees data for all employees and all shifts
  // Manager sees only their own employees and shifts
  const isAdmin = role === "admin";
  const employeeCountFilter = isAdmin
    ? { role: "employee", isActive: true }
    : { role: "employee", isActive: true, managerId: userObjectId };
  const shiftScope = isAdmin ? {} : { createdByManager: userObjectId };

  // Run all database queries at the same time for speed
  const [
    totalEmployees,
    totalShifts,
    upcomingShiftsCount,
    nextUpcomingShift,
    recentShifts,
    capacityAgg,
    attendanceAgg,
  ] = await Promise.all([
    // Count how many active employees this manager has
    User.countDocuments(employeeCountFilter),

    // Count total shifts created by this manager
    Shift.countDocuments(shiftScope),

    // Count upcoming shifts (starting from today)
    Shift.countDocuments({ ...shiftScope, shiftStartTime: { $gte: today } }),

    // Find the very next upcoming shift for the "Next shift" KPI card
    Shift.findOne({ ...shiftScope, shiftStartTime: { $gte: today } })
      .sort({ shiftStartTime: 1 })
      .select("shiftTitle shiftStartTime")
      .lean(),

    // Get the 6 most recently created shifts for the shift list section
    Shift.find(shiftScope)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("acceptedEmployees", "username email")
      .select("shiftTitle shiftStartTime shiftEndTime slotsAvailable acceptedEmployees"),

    // Calculate capacity stats (filled slots vs total capacity vs understaffed shifts)
    Shift.aggregate([
      { $match: shiftScope },
      {
        $project: {
          filled: { $size: "$acceptedEmployees" },
          totalCapacity: { $add: ["$slotsAvailable", { $size: "$acceptedEmployees" }] },
          understaffed: { $cond: [{ $gt: ["$slotsAvailable", 0] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: "$totalCapacity" },
          filledSlots: { $sum: "$filled" },
          understaffedShifts: { $sum: "$understaffed" },
        },
      },
    ]),

    // Calculate today's attendance stats (present, absent, late)
    (async () => {
      const todayMatch = {
        ...shiftScope,
        shiftStartTime: { $gte: today, $lt: tomorrow },
      };

      // Get shift IDs for today so we can query attendance records
      const todayShiftIds = await Shift.distinct("_id", todayMatch);

      const [expectedAgg, presentToday, lateToday] = await Promise.all([
        // Count how many employees are expected today across all today's shifts
        Shift.aggregate([
          { $match: todayMatch },
          {
            $group: {
              _id: null,
              expectedToday: { $sum: { $size: "$acceptedEmployees" } },
            },
          },
        ]),
        // Count how many are currently checked in
        Attendance.countDocuments({
          shift: { $in: todayShiftIds },
          status: "checked_in",
        }),
        // Count how many arrived late
        Attendance.countDocuments({
          shift: { $in: todayShiftIds },
          status: "checked_in",
          isLate: true,
        }),
      ]);

      const expectedToday = expectedAgg[0]?.expectedToday || 0;
      return [{ expectedToday, presentToday, lateToday }];
    })(),
  ]);

  // Calculate capacity percentage from the aggregation result
  const cap = capacityAgg[0] || { totalCapacity: 0, filledSlots: 0, understaffedShifts: 0 };
  const capacityPercent =
    cap.totalCapacity > 0 ? Math.round((cap.filledSlots / cap.totalCapacity) * 100) : 0;

  // Calculate attendance stats for today
  const att = attendanceAgg[0] || { expectedToday: 0, presentToday: 0, lateToday: 0 };
  const absentToday = Math.max(0, att.expectedToday - att.presentToday);
  const attendanceRate =
    att.expectedToday > 0 ? Math.round((att.presentToday / att.expectedToday) * 100) : 0;

  // Build any quick notification messages for the dashboard
  const notifications = [];
  if (cap.understaffedShifts > 0) {
    notifications.push(`${cap.understaffedShifts} shifts need more staff`);
  }
  if (nextUpcomingShift) {
    notifications.push(`Next shift: ${getNextShiftLabel(nextUpcomingShift.shiftStartTime)}`);
  }

  return sendSuccess(res, 200, {
    data: {
      stats: {
        totalEmployees,
        totalShifts,
        upcomingCount: upcomingShiftsCount,
        nextShift: nextUpcomingShift
          ? {
              date: nextUpcomingShift.shiftStartTime,
              label: getNextShiftLabel(nextUpcomingShift.shiftStartTime),
            }
          : null,
      },
      capacity: capacityPercent,
      attendance: {
        presentToday: att.presentToday,
        absentToday,
        lateToday: att.lateToday || 0,
        rate: attendanceRate,
      },
      understaffedShifts: cap.understaffedShifts,
      notifications,
      recentShifts,
    },
  });
});
