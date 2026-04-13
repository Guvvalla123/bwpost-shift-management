const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const attendanceService = require("../services/attendanceService");

exports.checkIn = asyncHandler(async (req, res) => {
  const { message, data } = await attendanceService.checkIn(req, req.user, req.body);
  return sendSuccess(res, 200, { message, data });
});

exports.checkOut = asyncHandler(async (req, res) => {
  const { message, data } = await attendanceService.checkOut(req, req.user, req.body);
  return sendSuccess(res, 200, { message, data });
});

exports.startBreak = asyncHandler(async (req, res) => {
  const { message, data } = await attendanceService.startBreak(req, req.user, req.body);
  return sendSuccess(res, 200, { message, data });
});

exports.endBreak = asyncHandler(async (req, res) => {
  const { message, data } = await attendanceService.endBreak(req, req.user, req.body);
  return sendSuccess(res, 200, { message, data });
});

exports.getShiftAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.getShiftAttendance(req.user, req.params.shiftId);
  return sendSuccess(res, 200, { data });
});

exports.getMyAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.getMyAttendance(req.user.id, req.params.shiftId);
  return sendSuccess(res, 200, { data });
});
