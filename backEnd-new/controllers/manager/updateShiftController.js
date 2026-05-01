// updateShiftController.js
// Updates an existing shift.
// Manager can change title time slots or notes.
//
// Route: PUT /api/manager/shifts/:shiftId
//
// Who can access: admin and manager only
//
// URL params:
// shiftId - the ID of shift to update
//
// Request body (all optional):
// shiftTitle - new title
// shiftStartTime - new start time
// shiftEndTime - new end time
// slotsAvailable - new slot count
// shiftNotes - new notes

const Shift = require("../../models/Shift");

const { sendSuccess, sendError } = require("../../helpers/sendResponse");

const saveAuditLog = require("../../helpers/saveAuditLog");

/**
 * Partially updates a shift after enforcing ownership rules.
 */
async function updateShiftController(req, res, next) {
  try {
    // Get shift ID from URL
    const shiftId = req.params.shiftId;

    // Find the shift first to check ownership
    const shift = await Shift.findById(shiftId);

    // If shift not found
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    // Check manager owns this shift
    if (req.user.role === "manager") {
      if (shift.createdByManager.toString() !== req.user.id.toString()) {
        return sendError(res, 403, "You can only edit your own shifts");
      }
    }

    // Fields to update came from validators + JSON body
    const {
      shiftTitle,
      shiftStartTime,
      shiftEndTime,
      slotsAvailable,
      shiftNotes,
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};

    if (shiftTitle !== undefined && shiftTitle !== null) {
      updateData.shiftTitle = shiftTitle;
    }

    if (shiftStartTime !== undefined && shiftStartTime !== null) {
      updateData.shiftStartTime = shiftStartTime;
    }

    if (shiftEndTime !== undefined && shiftEndTime !== null) {
      updateData.shiftEndTime = shiftEndTime;
    }

    if (
      slotsAvailable !== undefined &&
      slotsAvailable !== null &&
      slotsAvailable !== ""
    ) {
      updateData.slotsAvailable = slotsAvailable;
    }

    // shiftNotes may legitimately be an empty string
    if (shiftNotes !== undefined) {
      updateData.shiftNotes = shiftNotes;
    }

    // Update the shift in database
    const updatedShift = await Shift.findByIdAndUpdate(
      shiftId,

      updateData,

      // new: true returns the updated document after apply
      { new: true }
    ).populate("createdByManager", "username email");

    // Save audit log
    await saveAuditLog(
      "shift.updated",
      req.user.id,

      req.user.role,

      { shiftId, updatedFields: updateData },

      req.ip
    );

    return sendSuccess(res, 200, "Shift updated successfully", {
      shift: updatedShift,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = updateShiftController;
