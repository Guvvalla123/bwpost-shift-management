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

    const [totalEmployees, totalManagers, totalShifts, upcomingShiftsCount, nextUpcomingShift, recentShifts, allShifts] =
      await Promise.all([
        User.countDocuments({ role: "employee" }),
        User.countDocuments({ role: "manager" }),
        Shift.countDocuments(),
        Shift.countDocuments({ shiftStartTime: { $gte: today } }),
        Shift.findOne({ shiftStartTime: { $gte: today } }).sort({ shiftStartTime: 1 }),
        Shift.find()
          .sort({ createdAt: -1 })
          .limit(6)
          .populate("acceptedEmployees", "username email")
          .select("shiftTitle shiftStartTime slotsAvailable acceptedEmployees"),
        Shift.find(),
      ]);

    let totalSlots = 0;
    let filledSlots = 0;
    let understaffedShifts = 0;

    allShifts.forEach((shift) => {
      totalSlots += shift.slotsAvailable;
      filledSlots += shift.acceptedEmployees.length;
      if (shift.acceptedEmployees.length < shift.slotsAvailable) understaffedShifts++;
    });

    const capacityPercent = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

    const shiftsToday = await Shift.find({
      shiftStartTime: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    let presentToday = 0;
    let expectedToday = 0;
    shiftsToday.forEach((shift) => {
      presentToday += shift.attendance.length;
      expectedToday += shift.acceptedEmployees.length;
    });
    const absentToday = Math.max(0, expectedToday - presentToday);
    const attendanceRate = expectedToday > 0 ? Math.round((presentToday / expectedToday) * 100) : 0;

    const notifications = [];
    if (understaffedShifts > 0) notifications.push(`${understaffedShifts} shifts need more staff`);
    if (nextUpcomingShift)
      notifications.push(`Next shift: ${getNextShiftLabel(nextUpcomingShift.shiftStartTime)}`);

    res.status(200).json({
      stats: {
        totalEmployees,
        totalManagers,
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
      attendance: { presentToday, absentToday, rate: attendanceRate },
      understaffedShifts,
      notifications,
      recentShifts,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load dashboard", error: error.message });
  }
};
