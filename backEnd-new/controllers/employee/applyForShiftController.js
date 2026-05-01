// applyForShiftController.js
// Route: POST /api/employee/shifts/applyForShift
// Who: employee only
// Attempts atomic slot grab + roster add.

const Shift = require("../../models/Shift");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

const mongoose = require("mongoose");

// Validates business rules through one conditional update.
async function applyForShiftController(
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

        slotsAvailable: { $gte: 1 },

        acceptedEmployees: {
          $nin: [empId],
        },
      },
      {
        $addToSet: {
          acceptedEmployees: empId,
        },

        $inc: {
          slotsAvailable: -1,
        },
      },
      { new: true }
    );

    if (!shift) {
      return sendError(
        res,
        400,
        "Cannot apply — shift unavailable, started, already joined, or no slots."
      );
    }

    await saveAuditLog(
      "shift.apply",
      req.user.id,
      req.user.role,
      {
        shiftId: shift._id,
        shiftTitle: shift.shiftTitle,
      },
      req.ip
    );

    return sendSuccess(res, 200, "Applied to shift successfully", {
      shift,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = applyForShiftController;
