const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const shiftRequestService = require("../services/shiftRequestService");

exports.getAllRequests = asyncHandler(async (req, res) => {
  const result = await shiftRequestService.getAllRequests(req.user, req.query);
  return sendSuccess(res, 200, { data: result.data, pagination: result.pagination });
});

exports.approveRequest = asyncHandler(async (req, res) => {
  const { message, data } = await shiftRequestService.approveRequest(
    req,
    req.user,
    req.params.id,
    req.body
  );
  return sendSuccess(res, 200, { message, data });
});

exports.rejectRequest = asyncHandler(async (req, res) => {
  const { message, data } = await shiftRequestService.rejectRequest(
    req,
    req.user,
    req.params.id,
    req.body
  );
  return sendSuccess(res, 200, { message, data });
});
