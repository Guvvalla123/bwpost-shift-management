const Shift = require("../models/shiftModel");
const ShiftRequest = require("../models/shiftRequestModel");

/* ─────────────────────────────────────────────────────────────
   GET AVAILABLE SHIFTS
   Upcoming shifts with open slots that the employee can apply for
───────────────────────────────────────────────────────────────*/
exports.getAvailableShifts = async (req, res) => {
    try {
        const today = new Date();
        const shifts = await Shift.find({
            shiftStartTime: { $gte: today },
            slotsAvailable: { $gt: 0 },
        })
            .populate("createdByManager", "username")
            .sort({ shiftStartTime: 1 });

        return res.status(200).json({ success: true, data: shifts });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching available shifts" });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET MY SHIFTS
   All shifts the employee has been accepted into
───────────────────────────────────────────────────────────────*/
exports.getMyShifts = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const shifts = await Shift.find({ acceptedEmployees: employeeId })
            .populate("createdByManager", "username email")
            .sort({ shiftStartTime: 1 });

        return res.status(200).json({ success: true, data: shifts });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching your shifts" });
    }
};

/* ─────────────────────────────────────────────────────────────
   APPLY FOR SHIFT
───────────────────────────────────────────────────────────────*/
exports.applyForShift = async (req, res) => {
    try {
        const { shiftId } = req.body;
        const employeeId = req.user.id;

        const shift = await Shift.findById(shiftId);
        if (!shift) return res.status(404).json({ message: "Shift not found" });

        if (shift.acceptedEmployees.some(id => id.toString() === employeeId))
            return res.status(400).json({ message: "You have already applied for this shift" });

        if (shift.slotsAvailable <= 0)
            return res.status(400).json({ message: "No slots available for this shift" });

        shift.acceptedEmployees.push(employeeId);
        shift.slotsAvailable -= 1;
        await shift.save();

        return res.status(200).json({ message: "Successfully applied for the shift" });
    } catch (error) {
        return res.status(500).json({ message: "Error applying for shift" });
    }
};

/* ─────────────────────────────────────────────────────────────
   CANCEL SHIFT APPLICATION (advance notice — removes directly)
───────────────────────────────────────────────────────────────*/
exports.cancelShiftApplication = async (req, res) => {
    try {
        const { shiftId } = req.body;
        const employeeId = req.user.id;

        const shift = await Shift.findById(shiftId);
        if (!shift) return res.status(404).json({ message: "Shift not found" });

        if (!shift.acceptedEmployees.some(id => id.toString() === employeeId))
            return res.status(400).json({ message: "You have not applied for this shift" });

        shift.acceptedEmployees = shift.acceptedEmployees.filter(id => id.toString() !== employeeId);
        shift.slotsAvailable += 1;
        await shift.save();

        return res.status(200).json({ message: "Successfully cancelled shift application" });
    } catch (error) {
        return res.status(500).json({ message: "Error cancelling shift application" });
    }
};

/* ─────────────────────────────────────────────────────────────
   SUBMIT LEAVE REQUEST
   Employee wants to leave a shift they already accepted
───────────────────────────────────────────────────────────────*/
exports.submitLeaveRequest = async (req, res) => {
    try {
        const { shiftId, reason } = req.body;
        const employeeId = req.user.id;

        const shift = await Shift.findById(shiftId);
        if (!shift) return res.status(404).json({ message: "Shift not found" });

        if (!shift.acceptedEmployees.some(id => id.toString() === employeeId))
            return res.status(400).json({ message: "You are not assigned to this shift" });

        // Check if a pending leave request already exists
        const existing = await ShiftRequest.findOne({
            employee: employeeId,
            currentShift: shiftId,
            type: "leave",
            status: "pending",
        });
        if (existing) return res.status(400).json({ message: "You already have a pending leave request for this shift" });

        const request = await ShiftRequest.create({
            type: "leave",
            employee: employeeId,
            currentShift: shiftId,
            reason: reason || "",
        });

        return res.status(201).json({ message: "Leave request submitted successfully", data: request });
    } catch (error) {
        return res.status(500).json({ message: "Error submitting leave request" });
    }
};

/* ─────────────────────────────────────────────────────────────
   SUBMIT SHIFT CHANGE REQUEST
   Employee wants to swap from their current shift to another
───────────────────────────────────────────────────────────────*/
exports.submitShiftChangeRequest = async (req, res) => {
    try {
        const { currentShiftId, requestedShiftId, reason } = req.body;
        const employeeId = req.user.id;

        const [currentShift, requestedShift] = await Promise.all([
            Shift.findById(currentShiftId),
            Shift.findById(requestedShiftId),
        ]);

        if (!currentShift) return res.status(404).json({ message: "Current shift not found" });
        if (!requestedShift) return res.status(404).json({ message: "Requested shift not found" });

        if (!currentShift.acceptedEmployees.some(id => id.toString() === employeeId))
            return res.status(400).json({ message: "You are not assigned to the current shift" });

        if (requestedShift.slotsAvailable <= 0)
            return res.status(400).json({ message: "Requested shift has no available slots" });

        // Check if a pending change request already exists
        const existing = await ShiftRequest.findOne({
            employee: employeeId,
            currentShift: currentShiftId,
            type: "shift_change",
            status: "pending",
        });
        if (existing) return res.status(400).json({ message: "You already have a pending shift change request" });

        const request = await ShiftRequest.create({
            type: "shift_change",
            employee: employeeId,
            currentShift: currentShiftId,
            requestedShift: requestedShiftId,
            reason: reason || "",
        });

        return res.status(201).json({ message: "Shift change request submitted successfully", data: request });
    } catch (error) {
        return res.status(500).json({ message: "Error submitting shift change request" });
    }
};

/* ─────────────────────────────────────────────────────────────
   GET MY REQUESTS
   Employee sees all their own submitted requests + status
───────────────────────────────────────────────────────────────*/
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await ShiftRequest.find({ employee: req.user.id })
            .populate("currentShift", "shiftTitle shiftStartTime shiftEndTime")
            .populate("requestedShift", "shiftTitle shiftStartTime shiftEndTime")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching requests" });
    }
};
