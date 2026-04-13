const Joi = require("joi");

exports.approveRequestSchema = Joi.object({
  managerNote: Joi.string().max(500).trim().allow("").optional(),
});

exports.rejectRequestSchema = Joi.object({
  managerNote: Joi.string().max(500).trim().allow("").optional(),
});

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
