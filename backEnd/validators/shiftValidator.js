const Joi = require('joi');

exports.createShiftSchema = Joi.object({
  shiftTitle: Joi.string().min(3).max(60).required(),
  shiftStartTime: Joi.date().required(),
  shiftEndTime: Joi.date().required(),
  shiftNotes: Joi.string().max(300).allow('', null),
});

exports.updateShiftSchema = Joi.object({
  shiftTitle: Joi.string().min(3).max(60),
  shiftStartTime: Joi.date(),
  shiftEndTime: Joi.date(),
  shiftNotes: Joi.string().max(300).allow('', null),
}).min(1);

exports.assignEmployeeSchema = Joi.object({
  employeeIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required(),
});
