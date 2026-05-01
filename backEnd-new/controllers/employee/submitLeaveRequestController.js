// submitLeaveRequestController.js
// Route: POST /api/employee/shifts/requests/leave
// Who: employee only
// Creates a pending leave request tied to an assigned shift.

const Shift = require("../../models/Shift");

const ShiftRequest = require("../../models/ShiftRequest");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// Validates assignment + duplicate pending rows.
async function submitLeaveRequestController(
  req,
  res,
  next
) {
  try {
    const { shiftId, reason } = req.body;

    const employeeId = req.user.id;

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    const onRoster = shift.acceptedEmployees.some(
      function (id) {
        return id.toString() === employeeId.toString();
      }
    );

    if (!onRoster) {
      return sendError(
        res,
        403,
        "You must be assigned to this shift to request leave"
      );
    }

    const pendingExists =
      await ShiftRequest.findOne({
        employee: employeeId,

        currentShift: shiftId,

        status: "pending",
      });

    if (pendingExists) {
      return sendError(
        res,
        400,
        "A pending request already exists for this shift"
      );
    }

    const requestDoc = await ShiftRequest.create({
      type: "leave",

      employee: employeeId,

      currentShift: shiftId,

      reason: reason || "",

      status: "pending",
    });

    await saveAuditLog(
      "employee.request.leave",
      employeeId,
      req.user.role,
      {
        shiftId,
        requestId: requestDoc._id,
      },
      req.ip
    );

    return sendSuccess(res, 201, "Leave request submitted", {
      request: requestDoc,
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  submitLeaveRequestController;
