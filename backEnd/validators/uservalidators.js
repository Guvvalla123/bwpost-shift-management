const Joi = require('joi');

// register validation
exports.registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base": "Password must include uppercase, lowercase, number, and special character (!@#$%^&*)",
    }),
});

// login validation (email only)
exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const passwordResetPassword = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Password must include uppercase, lowercase, number, and special character (!@#$%^&*)",
  });

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string()
    .length(64)
    .pattern(/^[a-f0-9]+$/i)
    .required()
    .messages({
      "string.length": "Invalid reset token",
      "string.pattern.base": "Invalid reset token",
    }),
  password: passwordResetPassword,
});

exports.updateProfileSchema = Joi.object({
  username: Joi.string().min(2).max(50).trim().optional(),
  profileImage: Joi.string().uri({ scheme: ["https"] }).allow("").optional(),
})
  .or("username", "profileImage")
  .messages({
    "object.missing": "At least one of username or profileImage is required",
  });
