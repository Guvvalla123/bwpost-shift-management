const Joi = require("joi");

exports.approveRequestSchema = Joi.object({
  managerNote: Joi.string().max(500).trim().allow("").optional(),
});

exports.rejectRequestSchema = Joi.object({
  managerNote: Joi.string().max(500).trim().allow("").optional(),
});
