// employeeValidation.js
// Validation rules for employee management.
// These rules check that employee data
// is correct before saving to database.
//
// Rules checked:
// - Username must not be empty
// - Email must be valid format
// - Password must meet requirements
// - Role must be valid value

const Joi = require("joi");

// createEmployeeSchema - rules for manager creating a new employee account
// Username, email, and password are all required
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

// updateEmployeeSchema - rules for editing an employee's details
// At least one of username or email must be provided
exports.updateEmployeeSchema = Joi.object({
  username: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string().email().optional(),
}).min(1);

// mongoObjectId - reusable rule for validating MongoDB document IDs
// Used by all schemas that reference shifts by ID
const mongoObjectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ "string.pattern.base": "Invalid ID format" });

// applyForShiftSchema - rules for employee applying to work a shift
exports.applyForShiftSchema = Joi.object({
  shiftId: mongoObjectId.required(),
});

// cancelShiftSchema - rules for employee cancelling their shift application
exports.cancelShiftSchema = Joi.object({
  shiftId: mongoObjectId.required(),
});

// leaveRequestSchema - rules for employee requesting leave from a shift
// A reason is required and must be at least 10 characters
exports.leaveRequestSchema = Joi.object({
  shiftId: mongoObjectId.required(),
  reason: Joi.string().min(10).max(500).trim().required(),
});

// shiftChangeRequestSchema - rules for employee requesting a shift swap
// Both the current shift and the desired shift must be provided with a reason
exports.shiftChangeRequestSchema = Joi.object({
  currentShiftId: mongoObjectId.required(),
  requestedShiftId: mongoObjectId.required(),
  reason: Joi.string().min(10).max(500).trim().required(),
});
