// getWeeklyHoursController.js
// Gets total hours worked this week
// for the logged in employee.
//
// Route: GET /api/attendance/weekly-hours
//
// Who can access: any logged in user
//
// Returns:
// weeklyMinutes, weeklyHours, isBelow40Hours, weeklyLimit

const { getWeeklyMinutes, isBelow40Hours } =
  require("../../helpers/calculateWeeklyHours");

const { sendSuccess } =
  require("../../helpers/sendResponse");

async function getWeeklyHoursController(req, res, next) {
  try {
    const employeeId = req.user.id;

    const weeklyMinutes =
      await getWeeklyMinutes(employeeId);

    const weeklyHours =
      Math.round((weeklyMinutes / 60) * 100) / 100;

    const belowLimit =
      await isBelow40Hours(employeeId);

    return sendSuccess(res, 200,
      "Weekly hours loaded",
      {
        weeklyMinutes,
        weeklyHours,
        isBelow40Hours: belowLimit,
        weeklyLimit: 40,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = getWeeklyHoursController;
