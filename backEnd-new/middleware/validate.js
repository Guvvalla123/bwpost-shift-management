// validate.js
// This middleware checks request data
// using express-validator.
//
// HOW IT WORKS:
// 1. We define validation rules in route files
//    using express-validator check() function
// 2. We add validate middleware after the rules
// 3. validate reads the validation results
// 4. If any rule failed it sends 400 error
//    with a list of what went wrong
// 5. If all rules passed it calls next()
//    and the controller runs normally
//
// HOW TO USE IN ROUTES:
// const { check } = require("express-validator")
// const validate = require("../middleware/validate")
//
// router.post("/login", [
//   check("email")
//     .isEmail()
//     .withMessage("Please enter a valid email"),
//   check("password")
//     .isLength({ min: 6 })
//     .withMessage("Password must be at least 6 chars"),
//   validate
// ], login)

const { validationResult } = require("express-validator");
const { sendError } = require("../helpers/sendResponse");

// validate - checks if any validation rules failed
// If any failed sends 400 with list of errors
// If all passed calls next() to run controller
function validate(req, res, next) {
  // Get all validation results from the request
  const errors = validationResult(req);

  // If there are no errors continue to controller
  if (errors.isEmpty()) {
    return next();
  }

  // Get the first error message to show the user
  // We show one error at a time for simplicity
  const firstError = errors.array()[0].msg;

  // Send 400 Bad Request with the error message
  return sendError(res, 400, firstError);
}

module.exports = validate;
