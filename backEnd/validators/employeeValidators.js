const Joi = require("joi");

exports.createEmployeeSchema = Joi.object({
  username: Joi.string().min(3).max(30).trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base": "Password must include uppercase, lowercase, number, and special character",
    }),
});

exports.updateEmployeeSchema = Joi.object({
  username: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string().email().optional(),
}).min(1);

const mongoObjectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ "string.pattern.base": "Invalid ID format" });

exports.applyForShiftSchema = Joi.object({
  shiftId: mongoObjectId.required(),
});

exports.cancelShiftSchema = Joi.object({
  shiftId: mongoObjectId.required(),
});

exports.leaveRequestSchema = Joi.object({
  shiftId: mongoObjectId.required(),
  reason: Joi.string().min(10).max(500).trim().required(),
});

exports.shiftChangeRequestSchema = Joi.object({
  currentShiftId: mongoObjectId.required(),
  requestedShiftId: mongoObjectId.required(),
  reason: Joi.string().min(10).max(500).trim().required(),
});
