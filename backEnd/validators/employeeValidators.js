const Joi = require("joi");

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

exports.updateEmployeeSchema = Joi.object({
  username: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string().email().optional(),
}).min(1);
