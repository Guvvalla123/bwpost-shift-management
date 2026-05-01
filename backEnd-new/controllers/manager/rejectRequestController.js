// rejectRequestController.js
// Route: PUT /api/manager/requests/:requestId/reject
// Who: manager and admin
// Marks request rejected and notifies employee.

const Shift = require("../../models/Shift");

const ShiftRequest = require("../../models/ShiftRequest");

const Notification = require("../../models/Notification");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// Persists manager note + audit trail.
async function rejectRequestController(
  req,
  res,
  next
) {
  try {
    const requestId = req.params.requestId;

    const { managerNote } = req.body;

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
      const owns =
        currentShift.createdByManager.toString() ===
        req.user.id.toString();

      if (!owns) {
        return sendError(
          res,
          403,
          "You can only reject requests on your shifts"
        );
      }
    }

    requestDoc.status = "rejected";

    requestDoc.managerNote =
      managerNote !== undefined
        ? managerNote
        : "";

    requestDoc.resolvedAt = new Date();

    await requestDoc.save();

    let noteText =
      "Your request was rejected for shift: " +
      currentShift.shiftTitle;

    if (managerNote) {
      noteText =
        noteText + " — Note: " + managerNote;
    }

    await Notification.create({
      recipient: requestDoc.employee,

      message: noteText,

      type: "request_update",

      relatedShift: currentShift._id,
    });

    await saveAuditLog(
      "request.reject",
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

    return sendSuccess(res, 200, "Request rejected", {
      request: fresh,
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  rejectRequestController;
