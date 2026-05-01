// createShiftController.js
// Creates a new shift in the database.
// After creating it notifies eligible employees.
//
// Route: POST /api/manager/shifts
//
// Who can access: admin and manager only
//
// Request body needed:
// shiftTitle - name of the shift
// shiftStartTime - when shift begins
// shiftEndTime - when shift ends
// slotsAvailable - how many employees needed
// shiftNotes - optional extra information
//
// SMART NOTIFICATIONS:
// After shift is created we check each employee.
// Only employees below 40 hours this week
// get a notification about the new shift.
// This follows German labor law guidelines.

// Persist new shift documents
const Shift = require("../../models/Shift");

// Needed to locate employees belonging to manager
const User = require("../../models/User");

// Store bell notifications
const Notification = require("../../models/Notification");

const { sendSuccess } = require("../../helpers/sendResponse");

// Record important audit trail rows
const saveAuditLog = require("../../helpers/saveAuditLog");

// Weekly hour eligibility check for notifications
const { isBelow40Hours } = require("../../helpers/calculateWeeklyHours");

/**
 * Validates body (via route middleware), persists shift,
 * notifies employees under hourly cap.
 */
async function createShiftController(req, res, next) {
  try {
    // Get shift details from request body (already trimmed by validators)
    const {
      shiftTitle,
      shiftStartTime,
      shiftEndTime,
      slotsAvailable,
      shiftNotes,
    } = req.body;

    // Create the new shift in database
    const newShift = await Shift.create({
      shiftTitle,

      shiftStartTime,

      shiftEndTime,

      slotsAvailable,

      // Allow empty notes
      shiftNotes: shiftNotes !== undefined ? shiftNotes : "",

      // Set the manager who created this shift (admin ids allowed too)
      createdByManager: req.user.id,
    });

    // Save audit log for shift creation
    await saveAuditLog(
      "shift.created",
      req.user.id,

      req.user.role,

      { shiftTitle, shiftId: newShift._id },

      req.ip
    );

    // SMART NOTIFICATIONS
    // Find active employees tied to whoever created this record
    const employees = await User.find({
      // Only employees (never managers/admins here)
      role: "employee",

      // Scoped to requesting manager/admin id
      managerId: req.user.id,

      isActive: true,
    });

    // Send notification to each eligible employee one by one
    for (const employee of employees) {
      const isEligible = await isBelow40Hours(employee._id);

      // Only notify if below 40 hours weekly cap
      if (isEligible) {
        await Notification.create({
          // Who should see this notification
          recipient: employee._id,

          message: "New shift available: " + shiftTitle,

          type: "new_shift",

          relatedShift: newShift._id,
        });
      }
    }

    // Return the created shift
    return sendSuccess(res, 201, "Shift created successfully", {
      shift: newShift,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = createShiftController;
