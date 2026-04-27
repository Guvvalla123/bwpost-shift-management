// inviteValidation.js
// Validation rules for invite routes.
// These rules check that invite data
// is correct before creating an invite.
//
// Rules checked:
// - Email must be valid format
// - Role must be manager or employee
// - Manager ID required for employee invites

const Joi = require("joi");

// createInviteSchema - rules for sending a new invite link
// Managers can invite employees, admins can invite anyone
exports.createInviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid("admin", "manager", "employee").required(),
  managerId: Joi.string().hex().length(24).optional(),
});

// acceptInviteSchema - rules for accepting an invite and creating an account
// The invite token plus username and password are required to register
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
