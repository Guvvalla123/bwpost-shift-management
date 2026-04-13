const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const inviteService = require("../services/inviteService");

exports.createInvite = asyncHandler(async (req, res) => {
  const { message, data } = await inviteService.createInvite(req, req.user, req.body);
  return sendSuccess(res, 201, { message, data });
});

exports.validateInvite = asyncHandler(async (req, res) => {
  const data = await inviteService.validateInviteToken(req.params.token);
  return sendSuccess(res, 200, { data });
});

exports.acceptInvite = asyncHandler(async (req, res) => {
  const { message } = await inviteService.acceptInvite(req, req.body);
  return sendSuccess(res, 201, { message });
});

exports.getAllInvites = asyncHandler(async (req, res) => {
  const result = await inviteService.getAllInvites(req.user, req.query);
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});
