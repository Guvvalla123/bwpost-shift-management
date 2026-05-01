// getAllShiftsController.js
// Gets a list of all shifts for the manager.
// Managers can search and filter shifts.
//
// Route: GET /api/manager/shifts
//
// Who can access: admin and manager only
//
// Query params supported:
// page - which page number (default 1)
// limit - how many per page (default 10)
// search - search by shift title
// status - filter by ongoing/upcoming/completed
//
// What this does:
// 1. Gets filter options from query params
// 2. Builds a database query
// 3. Gets shifts from database with pagination
// 4. Returns shifts list and total count

// Shift model to query database
const Shift = require("../../models/Shift");

// sendSuccess and sendError for responses (errors go to middleware via next)
const { sendSuccess } = require("../../helpers/sendResponse");

/**
 * Loads paginated shifts for the dashboard list.
 * Admins see every shift; managers only theirs.
 *
 * @param {object} req - Express request with query filters
 * @param {object} res - Express response
 * @param {function} next - Pass errors to centralized handler
 */
async function getAllShiftsController(req, res, next) {
  try {
    // Get pagination options from query
    // If not provided use default values
    const page = parseInt(req.query.page, 10) || 1;

    const limit = parseInt(req.query.limit, 10) || 10;

    // Calculate how many records to skip
    // Example: page 2 with limit 10 skips 10 records
    const skip = (page - 1) * limit;

    // Get search text from query
    const search = req.query.search || "";

    // Get status filter from query ("all", "ongoing", "upcoming", "completed")
    const status = req.query.status || "all";

    // Get current time for status calculations
    const now = new Date();

    // Build the database filter object
    const filter = {};

    // Managers only see their own shifts
    // Admins see all shifts
    if (req.user.role === "manager") {
      filter.createdByManager = req.user.id;
    }

    // If search text provided filter by title
    if (search) {
      // $regex makes it search anywhere in title
      // $options i makes it case insensitive
      filter.shiftTitle = {
        $regex: search,
        $options: "i",
      };
    }

    // If status filter provided add time filter
    if (status === "ongoing") {
      // Shift started before now and ends after now
      filter.shiftStartTime = { $lte: now };
      filter.shiftEndTime = { $gte: now };
    }

    if (status === "upcoming") {
      // Shift has not started yet
      filter.shiftStartTime = { $gt: now };
    }

    if (status === "completed") {
      // Shift has already ended
      filter.shiftEndTime = { $lt: now };
    }

    // Get total count for pagination
    const totalShifts = await Shift.countDocuments(filter);

    // Get the shifts from database
    const shifts = await Shift.find(filter)
      // Populate manager name for display
      .populate("createdByManager", "username email")
      // Populate employee names for display
      .populate("acceptedEmployees", "username email")
      // Sort newest first
      .sort({ createdAt: -1 })
      // Skip records for pagination
      .skip(skip)
      // Limit records per page
      .limit(limit);

    // Send success response with shifts and pagination
    return sendSuccess(res, 200, "Shifts loaded", {
      shifts,

      pagination: {
        // Current page number
        currentPage: page,

        // Total number of pages
        totalPages: Math.ceil(totalShifts / limit) || 1,

        // Total shifts matching filter
        totalShifts,

        // Shifts per page
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = getAllShiftsController;
