const Joi = require("joi");

exports.createUserSchema = Joi.object({
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
  role: Joi.string().valid("admin", "manager", "employee").required(),
  managerId: Joi.string().hex().length(24).optional(), // For employees: assigned manager
});

exports.updateUserRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "manager", "employee").required(),
  managerId: Joi.string().hex().length(24).when("role", {
    is: "employee",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
