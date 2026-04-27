// requestValidation.js
// Validation rules for shift request routes.
// These rules check that leave and shift
// change request data is correct.
//
// Rules checked:
// - Shift ID must be valid
// - Reason must not be empty
// - Request type must be valid value

const Joi = require("joi");

// approveRequestSchema - rules for approving a leave or shift change request
// Manager note is optional but limited to 500 characters
exports.approveRequestSchema = Joi.object({
  managerNote: Joi.string().max(500).trim().allow("").optional(),
});

// rejectRequestSchema - rules for rejecting a leave or shift change request
// Manager note is optional but limited to 500 characters
exports.rejectRequestSchema = Joi.object({
  managerNote: Joi.string().max(500).trim().allow("").optional(),
});

// getRequestsQuerySchema - rules for filtering the requests list
// Validates all query parameters used for pagination and filtering
exports.getRequestsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  status: Joi.string().valid("pending", "approved", "rejected").allow("", null),
  type: Joi.string().valid("leave", "shift_change").allow("", null),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  employeeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow("", null),
})
  .custom((value, helpers) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "date range")
  .messages({
    "any.invalid": "endDate must be on or after startDate",
  });
