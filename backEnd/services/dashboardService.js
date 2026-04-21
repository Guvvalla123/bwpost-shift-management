const mongoose = require("mongoose");

const User = require("../models/userModel");

const Shift = require("../models/shiftModel");

const Attendance = require("../models/attendanceModel");



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



const getDashboardData = async (userId, role) => {

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const userObjectId = new mongoose.Types.ObjectId(userId);



  const isAdmin = role === "admin";

  const employeeCountFilter = isAdmin

    ? { role: "employee", isActive: true }

    : { role: "employee", isActive: true, managerId: userObjectId };

  const shiftScope = isAdmin ? {} : { createdByManager: userObjectId };



  const [

    totalEmployees,

    totalShifts,

    upcomingShiftsCount,

    nextUpcomingShift,

    recentShifts,

    capacityAgg,

    attendanceAgg,

  ] = await Promise.all([

    User.countDocuments(employeeCountFilter),

    Shift.countDocuments(shiftScope),

    Shift.countDocuments({ ...shiftScope, shiftStartTime: { $gte: today } }),

    Shift.findOne({ ...shiftScope, shiftStartTime: { $gte: today } })

      .sort({ shiftStartTime: 1 })

      .select("shiftTitle shiftStartTime")

      .lean(),

    Shift.find(shiftScope)

      .sort({ createdAt: -1 })

      .limit(6)

      .populate("acceptedEmployees", "username email")

      .select("shiftTitle shiftStartTime shiftEndTime slotsAvailable acceptedEmployees"),

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

    (async () => {

      const todayMatch = {

        ...shiftScope,

        shiftStartTime: { $gte: today, $lt: tomorrow },

      };

      const todayShiftIds = await Shift.distinct("_id", todayMatch);

      const [expectedAgg, presentToday, lateToday] = await Promise.all([

        Shift.aggregate([

          { $match: todayMatch },

          {

            $group: {

              _id: null,

              expectedToday: { $sum: { $size: "$acceptedEmployees" } },

            },

          },

        ]),

        Attendance.countDocuments({

          shift: { $in: todayShiftIds },

          status: "checked_in",

        }),

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



  const cap = capacityAgg[0] || { totalCapacity: 0, filledSlots: 0, understaffedShifts: 0 };

  const capacityPercent =

    cap.totalCapacity > 0 ? Math.round((cap.filledSlots / cap.totalCapacity) * 100) : 0;



  const att = attendanceAgg[0] || { expectedToday: 0, presentToday: 0, lateToday: 0 };

  const absentToday = Math.max(0, att.expectedToday - att.presentToday);

  const attendanceRate =

    att.expectedToday > 0 ? Math.round((att.presentToday / att.expectedToday) * 100) : 0;



  const notifications = [];

  if (cap.understaffedShifts > 0) {

    notifications.push(`${cap.understaffedShifts} shifts need more staff`);

  }

  if (nextUpcomingShift) {

    notifications.push(`Next shift: ${getNextShiftLabel(nextUpcomingShift.shiftStartTime)}`);

  }



  return {

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

  };

};



module.exports = { getDashboardData };

