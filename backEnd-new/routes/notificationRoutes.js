// notificationRoutes.js
// BASE URL: /api/notifications
//
// read-all MUST register before ":notificationId" routes

const express = require("express");

const router = express.Router();

const isLoggedIn =
  require("../middleware/isLoggedIn");

const getMyNotificationsController =
  require("../controllers/notifications/getMyNotificationsController");

const markAllAsReadController =
  require("../controllers/notifications/markAllAsReadController");

const markOneAsReadController =
  require("../controllers/notifications/markOneAsReadController");

router.get(
  "/",

  isLoggedIn,

  getMyNotificationsController
);

router.put(
  "/read-all",

  isLoggedIn,

  markAllAsReadController
);

router.put(
  "/:notificationId/read",

  isLoggedIn,

  markOneAsReadController
);

module.exports = router;
