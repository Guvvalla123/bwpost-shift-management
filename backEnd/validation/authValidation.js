// authValidation.js
// Validation rules for authentication routes.
// These rules check that login and register
// data is correct before processing it.
//
// If validation fails the user gets a clear
// error message explaining what is wrong.
// Example: "Email must be a valid email address"
//
// Rules checked:
// - Email must be valid format
// - Password must be at least 8 characters
// - Username must not be empty
// - Required fields must be present

const Joi = require('joi');

// registerSchema - rules for registration form
// Checks all required fields for new user
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

// loginSchema - rules for login form data
// Checks email and password are provided
exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// passwordResetPassword - reusable password rule for reset flow
// Same strength requirements as registration
const passwordResetPassword = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Password must include uppercase, lowercase, number, and special character (!@#$%^&*)",
  });

// forgotPasswordSchema - rules for forgot password request
// Only needs an email address to send the reset link
exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

// resetPasswordSchema - rules for resetting password with token
// Checks the token is valid hex format and the new password meets requirements
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

// updateProfileSchema - rules for updating user profile
// Username and profileImage are both optional but at least one must be provided
exports.updateProfileSchema = Joi.object({
  username: Joi.string().min(2).max(50).trim().optional(),
  profileImage: Joi.string().uri({ scheme: ["https"] }).allow("").optional(),
})
  .or("username", "profileImage")
  .messages({
    "object.missing": "At least one of username or profileImage is required",
  });
