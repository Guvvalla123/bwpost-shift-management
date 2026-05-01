// markOneAsReadController.js
// Route: PUT /api/notifications/:notificationId/read
// Who: any logged-in user
// Flips single notification read flag after ownership check.

const Notification = require("../../models/Notification");

const {
  sendSuccess,
  sendError,
} = require("../../helpers/sendResponse");

// markOneAsReadController - validates row belongs to caller
async function markOneAsReadController(
  req,
  res,
  next
) {
  try {
    const { notificationId } = req.params;

    const note =
      await Notification.findOne({
        _id: notificationId,

        recipient: req.user.id,
      });

    if (!note) {
      return sendError(
        res,
        404,
        "Notification not found"
      );
    }

    // Flip state and persist
    note.isRead = true;

    await note.save();

    return sendSuccess(res, 200, "Marked as read", {
      notification: note,
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  markOneAsReadController;
