// notificationRoutes.js
// These routes handle notifications.
// Users see notifications in the bell icon in the top nav.
//
// BASE URL: /api/notifications
//
// WHEN NOTIFICATIONS ARE CREATED:
// 1. Manager creates a new shift — eligible employees below 40hrs get notified
// 2. Employee forgets to check out — auto checkout sends them a notification
// 3. Shift request is approved or rejected — employee gets notified
//
// ALL ROUTES REQUIRE isLoggedIn
//
// AVAILABLE ROUTES:
// GET /api/notifications           - get all notifications for logged in user
// PUT /api/notifications/read-all  - mark all notifications as read
// PUT /api/notifications/:id/read  - mark one notification as read

const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware/authMiddleware");

// All notification functions are in notificationController
const ctrl = require("../controllers/notificationController");

// GET /api/notifications
// Returns all notifications for the currently logged in user
// Also returns the unread count for the bell icon badge
router.get("/", isLoggedIn, ctrl.getMyNotifications);

// PUT /api/notifications/read-all
// Marks every unread notification as read for this user
// Called when user clicks "Mark all as read"
router.put("/read-all", isLoggedIn, ctrl.markAllRead);

// PUT /api/notifications/:id/read
// Marks a single notification as read by its ID
// Called when user clicks on a specific notification
router.put("/:id/read", isLoggedIn, ctrl.markOneRead);

module.exports = router;
