// adminValidation.js
// Validation rules for admin routes.
// These rules check that data is correct
// for admin operations like creating users
// and changing user roles.
//
// Rules checked:
// - User ID must be valid MongoDB ID
// - Role must be admin, manager or employee
// - Email must be valid format

const Joi = require("joi");

// createUserSchema - rules for admin creating a new user directly
// All fields including role are required
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
  managerId: Joi.string().hex().length(24).optional(),
});

// updateUserRoleSchema - rules for admin changing a user's role
// If the new role is employee a managerId must also be provided
exports.updateUserRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "manager", "employee").required(),
  managerId: Joi.string().hex().length(24).when("role", {
    is: "employee",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
