const Shift = require("../models/shiftModel");

// =======================================
// Employee: View All Available Shifts
// =======================================
exports.getAvailableShifts = async (req, res) => {
    try {
        const today = new Date();
        const shifts = await Shift.find({
            shiftStartTime: { $gte: today },
            slotsAvailable: { $gt: 0 },
        })
            .populate("createdByManager", "username")
            .sort({ shiftStartTime: 1 });

        return res.status(200).json({
            success: true,
            data: shifts,
        });
    } catch (error) {
        console.error("Error fetching available shifts:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching available shifts",
        });
    }
};

// =======================================
// Employee: Apply for a Shift
// =======================================
exports.applyForShift = async (req, res) => {
    try {
        const { shiftId } = req.body;
        const employeeId = req.user.id;

        if (!shiftId || !employeeId) {
            return res.status(400).json({
                message: "shiftId and employeeId are required",
            });
        }

        const shift = await Shift.findById(shiftId);

        if (!shift) {
            return res.status(404).json({ message: "Shift not found" });
        }

        if (shift.acceptedEmployees.toString().includes(employeeId)) {
            return res.status(400).json({
                message: "You have already applied for this shift",
            });
        }

        if (shift.slotsAvailable <= 0) {
            return res.status(400).json({
                message: "No slots available for this shift",
            });
        }

        shift.acceptedEmployees.push(employeeId);
        shift.slotsAvailable -= 1;

        await shift.save();

        return res.status(200).json({
            message: "Successfully applied for the shift",
        });
    } catch (error) {
        console.error("Error applying for shift:", error);
        return res.status(500).json({
            message: "Error applying for shift",
        });
    }
};

// Employee: Cancel Shift Application
exports.cancelShiftApplication = async (req, res) => {
    try {
        const { shiftId } = req.body;
        const employeeId = req.user.id;

        if (!shiftId || !employeeId) {
            return res.status(400).json({
                message: "shiftId and employeeId are required",
            });
        }

        const shift = await Shift.findById(shiftId);

        if (!shift) {
            return res.status(404).json({ message: "Shift not found" });
        }

        if (!shift.acceptedEmployees.toString().includes(employeeId)) {
            return res.status(400).json({
                message: "You have not applied for this shift",
            });
        }

        shift.acceptedEmployees = shift.acceptedEmployees.filter(
            (id) => id.toString() !== employeeId
        );

        shift.slotsAvailable += 1;

        await shift.save();

        return res.status(200).json({
            message: "Successfully canceled shift application",
        });
    } catch (error) {
        console.error("Error canceling shift application:", error);
        return res.status(500).json({
            message: "Error canceling shift application",
        });
    }
};
