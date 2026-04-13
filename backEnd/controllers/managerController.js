const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const shiftService = require("../services/shiftService");
const teamService = require("../services/teamService");

exports.getAllShiftsPublic = asyncHandler(async (req, res) => {
  const { message, data, pagination } = await shiftService.getAllShiftsPublic(req.query);
  return sendSuccess(res, 200, { message, data, pagination });
});

exports.createShift = asyncHandler(async (req, res) => {
  const { message, data } = await shiftService.createShift(req, req.user.id, req.body);
  return sendSuccess(res, 201, { message, data });
});

exports.getAllShiftsManager = asyncHandler(async (req, res) => {
  const { message, data, pagination } = await shiftService.getAllShiftsManager(req.user, req.query);
  return sendSuccess(res, 200, { message, data, pagination });
});

exports.getShiftById = asyncHandler(async (req, res) => {
  const { data } = await shiftService.getShiftById(req.user, req.params.shiftId);
  return sendSuccess(res, 200, { data });
});

exports.updateShift = asyncHandler(async (req, res) => {
  const { message, data } = await shiftService.updateShift(req, req.user, req.params.shiftId, req.body);
  return sendSuccess(res, 200, { message, data });
});

exports.deleteShift = asyncHandler(async (req, res) => {
  const { message } = await shiftService.deleteShift(req, req.user, req.params.shiftId);
  return sendSuccess(res, 200, { message });
});

exports.getAllEmployees = asyncHandler(async (req, res) => {
  const result = await teamService.getAllEmployees(req.user, req.query);
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});

exports.getShiftAcceptedEmployees = asyncHandler(async (req, res) => {
  const { data } = await shiftService.getShiftAcceptedEmployees(req.user.id, req.params.shiftId);
  return sendSuccess(res, 200, { data });
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const { message, data } = await teamService.createEmployee(req, req.user.id, req.body);
  return sendSuccess(res, 201, { message, data });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const { message, data } = await teamService.updateEmployee(req, req.user, req.params.employeeId, req.body);
  return sendSuccess(res, 200, { message, data });
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
  const { message } = await teamService.deleteEmployee(req, req.user, req.params.employeeId);
  return sendSuccess(res, 200, { message });
});

exports.getEmployeeById = asyncHandler(async (req, res) => {
  const { data } = await teamService.getEmployeeById(req.user, req.params.employeeId);
  return sendSuccess(res, 200, { data });
});

exports.removeEmployeeFromShift = asyncHandler(async (req, res) => {
  const { message } = await shiftService.removeEmployeeFromShift(req, req.user, req.body);
  return sendSuccess(res, 200, { message });
});

exports.assignEmployeeToShift = asyncHandler(async (req, res) => {
  const { message } = await shiftService.assignEmployeeToShift(req, req.user, req.body);
  return sendSuccess(res, 200, { message });
});

exports.getEmployeeAttendanceHistory = asyncHandler(async (req, res) => {
  const result = await teamService.getEmployeeAttendanceHistory(
    req.user,
    req.params.employeeId,
    req.query
  );
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});
