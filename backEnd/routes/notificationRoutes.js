const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/notificationController");

router.get("/", auth, ctrl.getMyNotifications);
router.put("/read-all", auth, ctrl.markAllRead);
router.put("/:id/read", auth, ctrl.markOneRead);

module.exports = router;
