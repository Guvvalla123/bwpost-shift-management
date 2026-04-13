const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/dashboardService");

exports.getDashboardData = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const data = await dashboardService.getDashboardData(userId, role);
  return sendSuccess(res, 200, { data });
});
