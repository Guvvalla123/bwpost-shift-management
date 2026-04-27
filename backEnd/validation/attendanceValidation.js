// attendanceValidation.js
// Validation rules for attendance routes.
// These rules check that check in and
// check out data is correct.
//
// Rules checked:
// - Shift ID must be a valid MongoDB ID
// - Break type must be valid value

const Joi = require("joi");

// shiftIdEmployeeId - reusable base object for attendance requests
// Most attendance actions need a shiftId, and optionally an employeeId
// (managers can check in/out on behalf of employees)
const shiftIdEmployeeId = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).optional(),
});

// checkInSchema - rules for clocking in to a shift
// Accepts an optional checkInTime (defaults to server time if not provided)
exports.checkInSchema = shiftIdEmployeeId.keys({
  checkInTime: Joi.date().iso().optional(),
});

// checkOutSchema - rules for clocking out of a shift
// Accepts an optional checkOutTime and shift notes
exports.checkOutSchema = shiftIdEmployeeId.keys({
  checkOutTime: Joi.date().iso().optional(),
  notes: Joi.string().max(300).trim().optional(),
});

// startBreakSchema - rules for starting a break
// Break type is optional, defaults to short_break if not provided
exports.startBreakSchema = shiftIdEmployeeId.keys({
  type: Joi.string().valid("lunch", "short_break").optional(),
});

// endBreakSchema - rules for ending a break
// Only needs shiftId and optional employeeId
exports.endBreakSchema = shiftIdEmployeeId;

// assignEmployeeSchema - rules for manager assigning an employee to a shift
// Both shiftId and employeeId are required
exports.assignEmployeeSchema = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).required(),
});

// removeEmployeeSchema - rules for manager removing an employee from a shift
// Both shiftId and employeeId are required
exports.removeEmployeeSchema = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).required(),
});
