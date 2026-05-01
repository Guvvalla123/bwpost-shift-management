// requestRoutes.js
// BASE URL: /api/manager/requests
//
// Guards: isLoggedIn + manager OR admin

const express = require("express");

const router = express.Router();

const { check } = require("express-validator");

const isLoggedIn =
  require("../middleware/isLoggedIn");

const checkRole =
  require("../middleware/checkRole");

const validate =
  require("../middleware/validate");

const getAllRequestsController =
  require("../controllers/manager/getAllRequestsController");

const approveRequestController =
  require("../controllers/manager/approveRequestController");

const rejectRequestController =
  require("../controllers/manager/rejectRequestController");

const guard = [
  isLoggedIn,

  checkRole("manager", "admin"),
];

router.get("/", guard, getAllRequestsController);

router.put(
  "/:requestId/approve",

  guard,

  approveRequestController
);

router.put(
  "/:requestId/reject",

  guard,

  [
    check("managerNote")
      .optional()
      .isString(),
    validate,
  ],

  rejectRequestController
);

module.exports = router;
