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
