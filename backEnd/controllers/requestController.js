const ShiftRequest = require("../models/shiftRequestModel");
const Shift = require("../models/shiftModel");

/* ─────────────────────────────────────────────────────────────
   GET ALL REQUESTS
   Manager sees all pending/resolved leave & shift-change requests
   for their own shifts only
───────────────────────────────────────────────────────────────*/
exports.getAllRequests = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const managerId = req.user.id;

        const managerShiftIds = await Shift.find({ createdByManager: managerId }).distinct("_id");

        const filter = { currentShift: { $in: managerShiftIds } };
        if (status) filter.status = status;
        if (type) filter.type = type;

        const [requests, total] = await Promise.all([
            ShiftRequest.find(filter)
                .populate("employee", "username email profileImage")
                .populate("currentShift", "shiftTitle shiftStartTime shiftEndTime")
                .populate("requestedShift", "shiftTitle shiftStartTime shiftEndTime slotsAvailable")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ShiftRequest.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true, data: requests,
            total, page: Number(page), pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("getAllRequests:", error);
        return res.status(500).json({ success: false, message: "Error fetching requests" });
    }
};

/* ─────────────────────────────────────────────────────────────
   APPROVE REQUEST
───────────────────────────────────────────────────────────────*/
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { managerNote } = req.body;

        const request = await ShiftRequest.findById(id)
            .populate("currentShift")
            .populate("requestedShift");

        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.status !== "pending") return res.status(400).json({ message: "Request already resolved" });

        if (request.currentShift.createdByManager.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only approve requests for your own shifts" });
        }

        const employeeId = request.employee.toString();

        if (request.type === "leave") {
            // Remove employee from the shift, free up slot
            const shift = request.currentShift;
            shift.acceptedEmployees = shift.acceptedEmployees.filter(id => id.toString() !== employeeId);
            shift.slotsAvailable += 1;
            await shift.save();
        } else if (request.type === "shift_change") {
            // Remove from current shift, add to requested shift
            const current = request.currentShift;
            const requested = request.requestedShift;

            if (!requested) return res.status(400).json({ message: "Requested shift no longer exists" });
            if (requested.slotsAvailable <= 0) return res.status(400).json({ message: "Requested shift is now full" });

            // Remove from current
            current.acceptedEmployees = current.acceptedEmployees.filter(id => id.toString() !== employeeId);
            current.slotsAvailable += 1;
            await current.save();

            // Add to requested (push ObjectId, not populated doc)
            requested.acceptedEmployees.push(request.employee._id || request.employee);
            requested.slotsAvailable -= 1;
            await requested.save();
        }

        request.status = "approved";
        request.managerNote = managerNote || "";
        request.resolvedAt = new Date();
        await request.save();

        return res.status(200).json({ message: "Request approved successfully", data: request });
    } catch (error) {
        console.error("approveRequest:", error);
        return res.status(500).json({ message: "Error approving request" });
    }
};

/* ─────────────────────────────────────────────────────────────
   REJECT REQUEST
───────────────────────────────────────────────────────────────*/
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { managerNote } = req.body;

        const request = await ShiftRequest.findById(id).populate("currentShift");
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.status !== "pending") return res.status(400).json({ message: "Request already resolved" });

        if (request.currentShift.createdByManager.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only reject requests for your own shifts" });
        }

        request.status = "rejected";
        request.managerNote = managerNote || "";
        request.resolvedAt = new Date();
        await request.save();

        return res.status(200).json({ message: "Request rejected", data: request });
    } catch (error) {
        console.error("rejectRequest:", error);
        return res.status(500).json({ message: "Error rejecting request" });
    }
};
