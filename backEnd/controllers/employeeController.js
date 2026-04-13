const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const employeeShiftService = require("../services/employeeShiftService");

exports.getAvailableShifts = asyncHandler(async (req, res) => {
  const result = await employeeShiftService.getAvailableShifts(req.query);
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});

exports.getMyShifts = asyncHandler(async (req, res) => {
  const result = await employeeShiftService.getMyShifts(req.user.id, req.query);
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});

exports.applyForShift = asyncHandler(async (req, res) => {
  const { message } = await employeeShiftService.applyForShift(req, req.user.id, req.body.shiftId);
  return sendSuccess(res, 200, { message });
});

exports.cancelShiftApplication = asyncHandler(async (req, res) => {
  const { message } = await employeeShiftService.cancelShiftApplication(
    req,
    req.user.id,
    req.body.shiftId
  );
  return sendSuccess(res, 200, { message });
});

exports.submitLeaveRequest = asyncHandler(async (req, res) => {
  const { message, data } = await employeeShiftService.submitLeaveRequest(req, req.user.id, req.body);
  return sendSuccess(res, 201, { message, data });
});

exports.submitShiftChangeRequest = asyncHandler(async (req, res) => {
  const { message, data } = await employeeShiftService.submitShiftChangeRequest(
    req,
    req.user.id,
    req.body
  );
  return sendSuccess(res, 201, { message, data });
});

exports.getMyRequests = asyncHandler(async (req, res) => {
  const result = await employeeShiftService.getMyRequests(req.user.id, req.query);
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});
