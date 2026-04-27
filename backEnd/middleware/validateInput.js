// validateInput.js
// Validates request data before it reaches
// the controller function.
//
// HOW IT WORKS:
// 1. Request comes in with body data
// 2. This middleware runs first
// 3. It checks the data against Joi rules
// 4. If data is valid it calls next()
//    and controller runs normally
// 5. If data is invalid it sends 400 error
//    with a clear message about what is wrong
//
// WHY WE VALIDATE:
// Without validation anyone could send
// any data to our API.
// Validation ensures we only process
// clean and correct data.
//
// HOW TO USE IN ROUTES:
// const validateInput = require("../middleware/validateInput");
// const { loginSchema } = require("../validation/authValidation");
//
// router.post("/login",
//   validateInput(loginSchema),
//   login
// );

const AppError = require("../helpers/AppError");
const { logEvent } = require("../helpers/securityLog");

// validateInput - validates request body against a Joi schema
// schema - the Joi schema to validate against
// Returns a middleware function that checks req.body
// If validation fails sends 400 with details about what is wrong
const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      });

      if (error) {
        logEvent("validation.body", req, { detailCount: error.details.length });
        return next(
          new AppError("Invalid request data", 400, {
            errors: error.details.map((item) => ({
              field: item.context.key,
              message: item.message,
            })),
          })
        );
      }

      req.body = value;
      next();
    } catch (err) {
      console.error("Validation error:", err);
      next(new AppError("Validation server error", 500));
    }
  };
};

// validateQuery - validates request query parameters against a Joi schema
// Used for GET requests where data comes from the URL query string
// schema - the Joi schema to validate against
// Returns a middleware function that checks req.query
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        logEvent("validation.query", req, { detailCount: error.details.length });
        return next(
          new AppError("Invalid query parameters", 400, {
            errors: error.details.map((item) => ({
              field: item.context.key,
              message: item.message,
            })),
          })
        );
      }

      req.query = value;
      next();
    } catch (err) {
      console.error("Query validation error:", err);
      next(new AppError("Validation server error", 500));
    }
  };
};

// Attach validateQuery as a property so routes can call:
// validate.validateQuery(schema)
validateInput.validateQuery = validateQuery;

module.exports = validateInput;
