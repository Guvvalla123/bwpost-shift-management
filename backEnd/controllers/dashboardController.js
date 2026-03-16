const mongoose = require("mongoose");
const User = require("../models/userModel");
const Shift = require("../models/shiftModel");

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

exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const managerId = new mongoose.Types.ObjectId(req.user.id);

    // totalEmployees: all employees in system (single-org scope). For multi-tenant, scope by manager.
    const [
      totalEmployees,
      totalShifts,
      upcomingShiftsCount,
      nextUpcomingShift,
      recentShifts,
      capacityAgg,
      attendanceAgg,
    ] = await Promise.all([
      User.countDocuments({ role: "employee" }),
      Shift.countDocuments({ createdByManager: managerId }),
      Shift.countDocuments({ createdByManager: managerId, shiftStartTime: { $gte: today } }),
      Shift.findOne({ createdByManager: managerId, shiftStartTime: { $gte: today } })
        .sort({ shiftStartTime: 1 })
        .select("shiftTitle shiftStartTime")
        .lean(),
      Shift.find({ createdByManager: managerId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("acceptedEmployees", "username email")
        .select("shiftTitle shiftStartTime shiftEndTime slotsAvailable acceptedEmployees"),

      // Capacity: aggregate instead of loading all shifts
      Shift.aggregate([
        { $match: { createdByManager: managerId } },
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

      // Today's attendance: aggregate instead of loading all shifts
      Shift.aggregate([
        {
          $match: {
            createdByManager: managerId,
            shiftStartTime: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $project: {
            expected: { $size: "$acceptedEmployees" },
            present: {
              $size: {
                $filter: {
                  input: "$attendance",
                  as: "att",
                  cond: { $eq: ["$$att.status", "checked_in"] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            expectedToday: { $sum: "$expected" },
            presentToday: { $sum: "$present" },
          },
        },
      ]),
    ]);

    const cap = capacityAgg[0] || { totalCapacity: 0, filledSlots: 0, understaffedShifts: 0 };
    const capacityPercent = cap.totalCapacity > 0
      ? Math.round((cap.filledSlots / cap.totalCapacity) * 100)
      : 0;

    const att = attendanceAgg[0] || { expectedToday: 0, presentToday: 0 };
    const absentToday = Math.max(0, att.expectedToday - att.presentToday);
    const attendanceRate = att.expectedToday > 0
      ? Math.round((att.presentToday / att.expectedToday) * 100)
      : 0;

    const notifications = [];
    if (cap.understaffedShifts > 0) notifications.push(`${cap.understaffedShifts} shifts need more staff`);
    if (nextUpcomingShift)
      notifications.push(`Next shift: ${getNextShiftLabel(nextUpcomingShift.shiftStartTime)}`);

    res.status(200).json({
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
      attendance: { presentToday: att.presentToday, absentToday, rate: attendanceRate },
      understaffedShifts: cap.understaffedShifts,
      notifications,
      recentShifts,
    });
  } catch (error) {
    console.error("getDashboardData:", error);
    res.status(500).json({ message: "Failed to load dashboard", error: error.message });
  }
};
