const Joi = require("joi");

exports.createShiftSchema = Joi.object({
  shiftTitle: Joi.string().min(1).max(100).trim().required(),
  shiftStartTime: Joi.date().iso().required(),
  shiftEndTime: Joi.date().iso().greater(Joi.ref("shiftStartTime")).required(),
  shiftNotes: Joi.string().max(300).trim().allow("").optional(),
  slotsAvailable: Joi.number().integer().min(1).max(500).required(),
});

exports.updateShiftSchema = Joi.object({
  shiftTitle: Joi.string().min(1).max(100).trim().optional(),
  shiftStartTime: Joi.date().iso().optional(),
  shiftEndTime: Joi.date().iso().optional(),
  shiftNotes: Joi.string().max(300).trim().allow("").optional(),
  slotsAvailable: Joi.number().integer().min(0).max(500).optional(),
}).min(1);

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
