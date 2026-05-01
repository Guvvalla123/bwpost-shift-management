// approveRequestController.js
// Route: PUT /api/manager/requests/:requestId/approve
// Who: manager and admin
// Applies roster adjustments when possible.

const Shift = require("../../models/Shift");

const ShiftRequest = require("../../models/ShiftRequest");

const Notification = require("../../models/Notification");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

async function approveRequestController(
  req,
  res,
  next
) {
  try {
    const requestId = req.params.requestId;

    const requestDoc =
      await ShiftRequest.findById(requestId);

    if (!requestDoc) {
      return sendError(
        res,
        404,
        "Request not found"
      );
    }

    if (requestDoc.status !== "pending") {
      return sendError(
        res,
        400,
        "Request is already processed"
      );
    }

    const currentShift =
      await Shift.findById(
        requestDoc.currentShift
      );

    if (!currentShift) {
      return sendError(
        res,
        404,
        "Referenced shift missing"
      );
    }

    if (req.user.role === "manager") {
      const ok =
        currentShift.createdByManager.toString() ===
        req.user.id.toString();

      if (!ok) {
        return sendError(
          res,
          403,
          "You can only approve requests tied to your shifts"
        );
      }
    }

    const employeeObjectId =
      requestDoc.employee;

    const leaveMessage =
      "Your leave request was approved for shift: " +
      currentShift.shiftTitle;

    const approveMessageShiftChange =
      "Your shift change request was approved. New shift: ";

    if (requestDoc.type === "leave") {
      const beforeCount =
        currentShift.acceptedEmployees.filter(
          function (id) {
            return (
              id.toString() ===
              employeeObjectId.toString()
            );
          }
        ).length;

      if (beforeCount === 0) {
        return sendError(
          res,
          400,
          "Employee is no longer on this shift"
        );
      }

      currentShift.acceptedEmployees.pull(
        employeeObjectId
      );

      currentShift.slotsAvailable += 1;

      await currentShift.save();

      requestDoc.status = "approved";

      requestDoc.resolvedAt = new Date();

      await requestDoc.save();

      await Notification.create({
        recipient: employeeObjectId,

        message: leaveMessage,

        type: "request_update",

        relatedShift: currentShift._id,
      });
    } else if (
      requestDoc.type === "shift_change"
    ) {
      const targetShift =
        await Shift.findById(
          requestDoc.requestedShift
        );

      if (!targetShift) {
        return sendError(
          res,
          404,
          "Requested shift not found"
        );
      }

      if (req.user.role === "manager") {
        const targetOk =
          targetShift.createdByManager.toString() ===
          req.user.id.toString();

        if (!targetOk) {
          return sendError(
            res,
            403,
            "Target shift belongs to another manager"
          );
        }
      }

      const stillOnCurrent =
        currentShift.acceptedEmployees.some(
          function (id) {
            return (
              id.toString() ===
              employeeObjectId.toString()
            );
          }
        );

      if (!stillOnCurrent) {
        return sendError(
          res,
          400,
          "Employee no longer on current shift"
        );
      }

      if (targetShift.slotsAvailable < 1) {
        return sendError(
          res,
          400,
          "Target shift no longer has slots"
        );
      }

      const now = new Date();

      if (targetShift.shiftStartTime <= now) {
        return sendError(
          res,
          400,
          "Target shift already started"
        );
      }

      currentShift.acceptedEmployees.pull(
        employeeObjectId
      );

      currentShift.slotsAvailable += 1;

      await currentShift.save();

      targetShift.acceptedEmployees.push(
        employeeObjectId
      );

      targetShift.slotsAvailable -= 1;

      await targetShift.save();

      requestDoc.status = "approved";

      requestDoc.resolvedAt = new Date();

      await requestDoc.save();

      await Notification.create({
        recipient: employeeObjectId,

        message:
          approveMessageShiftChange +
          targetShift.shiftTitle,

        type: "request_update",

        relatedShift: targetShift._id,
      });
    }

    await saveAuditLog(
      "request.approve",
      req.user.id,
      req.user.role,
      {
        requestId: requestDoc._id,
        type: requestDoc.type,
      },
      req.ip
    );

    const fresh = await ShiftRequest.findById(
      requestDoc._id
    )
      .populate("employee", "username email")
      .populate(
        "currentShift",
        "shiftTitle shiftStartTime shiftEndTime"
      )
      .populate(
        "requestedShift",
        "shiftTitle shiftStartTime shiftEndTime"
      );

    return sendSuccess(res, 200, "Request approved", {
      request: fresh,
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  approveRequestController;
