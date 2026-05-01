// cancelShiftController.js
// Route: POST /api/employee/shifts/cancelShift
// Who: employee only
// Removes worker from roster if shift not started yet.

const Shift = require("../../models/Shift");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

const mongoose = require("mongoose");

// Drops employee assignment and restores one slot slot.
async function cancelShiftController(
  req,
  res,
  next
) {
  try {
    const { shiftId } = req.body;

    const empId =
      mongoose.Types.ObjectId.createFromHexString(
        req.user.id.toString()
      );

    const now = new Date();

    const shift = await Shift.findOneAndUpdate(
      {
        _id: shiftId,

        shiftStartTime: { $gt: now },

        acceptedEmployees: { $in: [empId] },
      },
      {
        $pull: {
          acceptedEmployees: empId,
        },

        $inc: {
          slotsAvailable: 1,
        },
      },
      { new: true }
    );

    if (!shift) {
      return sendError(
        res,
        400,
        "Cannot cancel — not assigned or shift already started."
      );
    }

    await saveAuditLog(
      "shift.cancel",
      req.user.id,
      req.user.role,
      {
        shiftId: shift._id,
        shiftTitle: shift.shiftTitle,
      },
      req.ip
    );

    return sendSuccess(res, 200, "Shift application canceled", {
      shift,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = cancelShiftController;
