const Joi = require("joi");

exports.createInviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid("admin", "manager", "employee").required(),
  managerId: Joi.string().hex().length(24).optional(),
});

exports.acceptInviteSchema = Joi.object({
  token: Joi.string().required(),
  username: Joi.string().min(3).max(30).trim().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base": "Password must include uppercase, lowercase, number, and special character",
    }),
});
