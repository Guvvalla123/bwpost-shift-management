const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/adminService");

exports.createUser = asyncHandler(async (req, res) => {
  const { message, data } = await adminService.createUser(req, req.body);
  return sendSuccess(res, 201, { message, data });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { message, data } = await adminService.updateUserRole(req, req.params.userId, req.body);
  return sendSuccess(res, 200, { message, data });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});

exports.generateUserPasswordResetLink = asyncHandler(async (req, res) => {
  const { message, data } = await adminService.generateUserPasswordResetLink(req, req.params.userId);
  return sendSuccess(res, 200, { message, data });
});
