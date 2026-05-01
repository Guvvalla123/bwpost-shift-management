// submitShiftChangeRequestController.js
// Route: POST /api/employee/shifts/requests/shift-change
// Who: employee only
// Swaps employee from current roster to a different open shift.

const Shift = require("../../models/Shift");

const ShiftRequest = require("../../models/ShiftRequest");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// Ensures both shifts valid and target has capacity.
async function submitShiftChangeRequestController(
  req,
  res,
  next
) {
  try {
    const {
      currentShiftId,
      requestedShiftId,
      reason,
    } = req.body;

    const employeeId = req.user.id;

    if (
      currentShiftId === requestedShiftId
    ) {
      return sendError(
        res,
        400,
        "Choose a different target shift"
      );
    }

    const currentShift =
      await Shift.findById(currentShiftId);

    const requestedShift =
      await Shift.findById(requestedShiftId);

    if (!currentShift || !requestedShift) {
      return sendError(
        res,
        404,
        "One or both shifts were not found"
      );
    }

    const onCurrent =
      currentShift.acceptedEmployees.some(
        function (id) {
          return id.toString() === employeeId.toString();
        }
      );

    if (!onCurrent) {
      return sendError(
        res,
        403,
        "You are not assigned to the current shift"
      );
    }

    const now = new Date();

    if (
      requestedShift.shiftStartTime <= now
    ) {
      return sendError(
        res,
        400,
        "Target shift has already started"
      );
    }

    if (requestedShift.slotsAvailable < 1) {
      return sendError(
        res,
        400,
        "Target shift has no open slots"
      );
    }

    const dupPending =
      await ShiftRequest.findOne({
        employee: employeeId,

        currentShift: currentShiftId,

        status: "pending",
      });

    if (dupPending) {
      return sendError(
        res,
        400,
        "Finish your existing pending request first"
      );
    }

    const requestDoc =
      await ShiftRequest.create({
        type: "shift_change",

        employee: employeeId,

        currentShift: currentShiftId,

        requestedShift: requestedShiftId,

        reason: reason || "",

        status: "pending",
      });

    await saveAuditLog(
      "employee.request.shift_change",
      employeeId,
      req.user.role,
      {
        currentShiftId,
        requestedShiftId,
        requestId: requestDoc._id,
      },
      req.ip
    );

    return sendSuccess(res, 201, "Shift change request submitted", {
      request: requestDoc,
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  submitShiftChangeRequestController;
