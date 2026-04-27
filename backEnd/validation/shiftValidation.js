// shiftValidation.js
// Validation rules for shift routes.
// These rules check that shift data
// is correct before saving to database.
//
// Rules checked:
// - Shift title must not be empty
// - Start time must be a valid date
// - End time must be after start time
// - Slots available must be a number

const Joi = require("joi");

// createShiftSchema - rules for creating a new shift
// All core fields are required when creating
exports.createShiftSchema = Joi.object({
  shiftTitle: Joi.string().min(1).max(100).trim().required(),
  shiftStartTime: Joi.date().iso().required(),
  shiftEndTime: Joi.date().iso().greater(Joi.ref("shiftStartTime")).required(),
  shiftNotes: Joi.string().max(300).trim().allow("").optional(),
  slotsAvailable: Joi.number().integer().min(1).max(500).required(),
});

// updateShiftSchema - rules for editing an existing shift
// All fields are optional but at least one must be provided
exports.updateShiftSchema = Joi.object({
  shiftTitle: Joi.string().min(1).max(100).trim().optional(),
  shiftStartTime: Joi.date().iso().optional(),
  shiftEndTime: Joi.date().iso().optional(),
  shiftNotes: Joi.string().max(300).trim().allow("").optional(),
  slotsAvailable: Joi.number().integer().min(0).max(500).optional(),
}).min(1);

// getShiftsQuerySchema - rules for shift list query parameters
// Validates pagination, filters, and sorting options in the URL
exports.getShiftsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  search: Joi.string().max(100).allow("", null),
  status: Joi.string()
    .valid("all", "upcoming", "ongoing", "completed", "past", "")
    .allow(null),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  sort: Joi.string().valid("asc", "desc").default("desc"),
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
