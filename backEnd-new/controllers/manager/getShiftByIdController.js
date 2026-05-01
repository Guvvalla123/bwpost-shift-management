// getShiftByIdController.js
// Gets one specific shift by its ID.
// Used when manager clicks on a shift
// to see full details.
//
// Route: GET /api/manager/shifts/:shiftId
//
// Who can access: admin and manager only
//
// URL params:
// shiftId - the MongoDB ID of the shift

// Shift collection for queries
const Shift = require("../../models/Shift");

// Consistent JSON responses
const { sendSuccess, sendError } = require("../../helpers/sendResponse");

/**
 * Finds a shift and checks manager ownership (admins may see any shift).
 *
 * @param {object} req - Request with route param shiftId + req.user from auth
 */
async function getShiftByIdController(req, res, next) {
  try {
    // Get shift ID from URL params
    const shiftId = req.params.shiftId;

    // Find the shift in database with related users
    const shift = await Shift.findById(shiftId)
      .populate("createdByManager", "username email")
      .populate("acceptedEmployees", "username email");

    // If shift not found
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    // Check if manager owns this shift
    // Admins can see any shift
    if (req.user.role === "manager") {
      // Compare creator id regardless of populate shape
      const creatorId =
        shift.createdByManager && shift.createdByManager._id
          ? shift.createdByManager._id.toString()
          : shift.createdByManager.toString();

      // Convert to string for comparison
      if (creatorId !== req.user.id.toString()) {
        return sendError(res, 403, "You can only view your own shifts");
      }
    }

    return sendSuccess(res, 200, "Shift loaded", { shift });
  } catch (error) {
    next(error);
  }
}

module.exports = getShiftByIdController;
