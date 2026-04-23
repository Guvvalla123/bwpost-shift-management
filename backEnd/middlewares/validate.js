const AppError = require("../utils/AppError");
const { logEvent } = require("../utils/securityLog");

const validate = (schema) => {
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

validate.validateQuery = validateQuery;

module.exports = validate;
