const Joi = require("joi");

const shiftIdEmployeeId = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).optional(),
});

exports.checkInSchema = shiftIdEmployeeId.keys({
  checkInTime: Joi.date().iso().optional(),
});

exports.checkOutSchema = shiftIdEmployeeId.keys({
  checkOutTime: Joi.date().iso().optional(),
  notes: Joi.string().max(300).trim().optional(),
});

exports.managerCheckInSchema = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).required(),
  checkInTime: Joi.date().iso().optional(),
});

exports.managerCheckOutSchema = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).required(),
  checkOutTime: Joi.date().iso().optional(),
});

exports.assignEmployeeSchema = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).required(),
});

exports.removeEmployeeSchema = Joi.object({
  shiftId: Joi.string().hex().length(24).required(),
  employeeId: Joi.string().hex().length(24).required(),
});
