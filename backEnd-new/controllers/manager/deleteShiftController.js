// deleteShiftController.js
// Deletes a shift from the database.
// Manager can only delete their own shifts.
//
// Route: DELETE /api/manager/shifts/:shiftId
//
// Who can access: admin and manager only
//
// URL params:
// shiftId - the ID of shift to delete
//
// What this does:
// 1. Finds the shift
// 2. Checks manager owns it
// 3. Deletes it from database
// 4. Saves audit log

const Shift = require("../../models/Shift");

const { sendSuccess, sendError } = require("../../helpers/sendResponse");

const saveAuditLog = require("../../helpers/saveAuditLog");

/**
 * Removes shift document after ownership checks.
 */
async function deleteShiftController(req, res, next) {
  try {
    // Get shift ID from URL
    const shiftId = req.params.shiftId;

    // Find the shift
    const shift = await Shift.findById(shiftId);

    // If shift not found
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    // Check manager owns this shift
    if (req.user.role === "manager") {
      if (shift.createdByManager.toString() !== req.user.id.toString()) {
        return sendError(res, 403, "You can only delete your own shifts");
      }
    }

    // Delete the shift from database
    await Shift.findByIdAndDelete(shiftId);

    // Save audit log
    await saveAuditLog(
      "shift.deleted",
      req.user.id,

      req.user.role,

      {
        shiftId,

        shiftTitle: shift.shiftTitle,
      },

      req.ip
    );

    return sendSuccess(res, 200, "Shift deleted successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = deleteShiftController;
