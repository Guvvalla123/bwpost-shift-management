const Shift = require("../models/shiftModel");

/* ── Helper: recalculate totals for an attendance record ───────── */
const recalc = (att, shiftStart, shiftEnd) => {
    const now = new Date();

    /* Work minutes = sum of all closed work sessions */
    let workMins = att.workSessions.reduce((sum, ws) => {
        if (!ws.checkOut) return sum;
        return sum + (ws.checkOut - ws.checkIn) / 60000;
    }, 0);

    /* If currently checked in (open session), add time so far */
    const openWork = att.workSessions.find(ws => !ws.checkOut);
    if (openWork) workMins += (now - openWork.checkIn) / 60000;

    /* Break minutes */
    let breakMins = att.breaks.reduce((sum, b) => {
        if (!b.end) return sum;
        return sum + (b.end - b.start) / 60000;
    }, 0);
    const openBreak = att.breaks.find(b => !b.end);
    if (openBreak) breakMins += (now - openBreak.start) / 60000;

    /* Shift scheduled duration */
    const scheduledMins = shiftEnd
        ? Math.max(0, (new Date(shiftEnd) - new Date(shiftStart)) / 60000)
        : 0;

    /* Net work (excluding breaks) */
    const netWorkMins = Math.max(0, workMins - breakMins);

    /* Overtime */
    const overtimeMins = Math.max(0, netWorkMins - scheduledMins);

    att.totalWorkMinutes = Math.round(netWorkMins);
    att.totalBreakMinutes = Math.round(breakMins);
    att.overtimeMinutes = Math.round(overtimeMins);
    att.totalHours = +(netWorkMins / 60).toFixed(2);
};

/* ── Helper: find or create attendance record ──────────────────── */
const getOrCreate = (shift, employeeId) => {
    let att = shift.attendance.find(a => a.employee.toString() === employeeId.toString());
    if (!att) {
        shift.attendance.push({ employee: employeeId });
        att = shift.attendance[shift.attendance.length - 1];
    }
    return att;
};

/* ══════════════════════════════════════════════════════════════════
   CHECK IN
   POST /api/attendance/checkin  { shiftId, employeeId? }
   employeeId → manager checking in someone else
   no employeeId → employee checking themselves in
══════════════════════════════════════════════════════════════════ */
exports.checkIn = async (req, res) => {
    try {
        const { shiftId, employeeId } = req.body;
        const targetId = employeeId || req.user.id;

        const shift = await Shift.findById(shiftId);
        if (!shift) return res.status(404).json({ status: "N", error: "Shift not found" });

        const att = getOrCreate(shift, targetId);

        /* State guard */
        if (att.status === "checked_out")
            return res.status(400).json({ status: "N", error: "Shift already completed" });
        if (att.status === "checked_in")
            return res.status(400).json({ status: "N", error: "Already checked in — check out first or take a break" });

        const now = new Date();

        /* Late detection (> 10 min grace period) */
        const shiftStart = new Date(shift.shiftStartTime);
        const minsLate = Math.floor((now - shiftStart) / 60000);
        if (att.workSessions.length === 0 && minsLate > 10) {
            att.isLate = true;
            att.lateByMins = minsLate;
        }

        /* Open a new work session */
        att.workSessions.push({ checkIn: now });
        att.status = "checked_in";
        att.checkIn = att.checkIn || now; // legacy

        recalc(att, shift.shiftStartTime, shift.shiftEndTime);
        await shift.save();

        res.json({ status: "Y", message: "Checked in successfully", data: att });
    } catch (err) {
        res.status(500).json({ status: "N", error: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════
   CHECK OUT
   POST /api/attendance/checkout  { shiftId, employeeId?, notes? }
══════════════════════════════════════════════════════════════════ */
exports.checkOut = async (req, res) => {
    try {
        const { shiftId, employeeId, notes } = req.body;
        const targetId = employeeId || req.user.id;

        const shift = await Shift.findById(shiftId);
        if (!shift) return res.status(404).json({ status: "N", error: "Shift not found" });

        const att = shift.attendance.find(a => a.employee.toString() === targetId.toString());
        if (!att) return res.status(400).json({ status: "N", error: "No attendance record found — check in first" });
        if (att.status === "checked_out")
            return res.status(400).json({ status: "N", error: "Already checked out" });
        if (att.status === "on_break")
            return res.status(400).json({ status: "N", error: "End break before checking out" });
        if (att.status !== "checked_in")
            return res.status(400).json({ status: "N", error: "Not currently checked in" });

        const now = new Date();

        /* Close open work session */
        const openWork = att.workSessions.find(ws => !ws.checkOut);
        if (openWork) openWork.checkOut = now;

        /* Left early detection */
        const shiftEnd = new Date(shift.shiftEndTime);
        if (now < shiftEnd) att.leftEarly = true;

        att.status = "checked_out";
        att.checkOut = now; // legacy
        if (notes) att.notes = notes;

        recalc(att, shift.shiftStartTime, shift.shiftEndTime);
        await shift.save();

        res.json({ status: "Y", message: "Checked out successfully", data: att });
    } catch (err) {
        res.status(500).json({ status: "N", error: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════
   START BREAK
   POST /api/attendance/break/start  { shiftId, type? }
   type: "lunch" | "short_break"
══════════════════════════════════════════════════════════════════ */
exports.startBreak = async (req, res) => {
    try {
        const { shiftId, type = "short_break" } = req.body;
        const targetId = req.body.employeeId || req.user.id;

        const shift = await Shift.findById(shiftId);
        if (!shift) return res.status(404).json({ status: "N", error: "Shift not found" });

        const att = shift.attendance.find(a => a.employee.toString() === targetId.toString());
        if (!att || att.status !== "checked_in")
            return res.status(400).json({ status: "N", error: "Must be checked in to start a break" });

        /* Only one active break at a time */
        if (att.breaks.some(b => !b.end))
            return res.status(400).json({ status: "N", error: "Already on a break" });

        const now = new Date();

        /* Close the current work session */
        const openWork = att.workSessions.find(ws => !ws.checkOut);
        if (openWork) openWork.checkOut = now;

        /* Open a break session */
        att.breaks.push({ start: now, type });
        att.status = "on_break";

        recalc(att, shift.shiftStartTime, shift.shiftEndTime);
        await shift.save();

        res.json({ status: "Y", message: "Break started", data: att });
    } catch (err) {
        res.status(500).json({ status: "N", error: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════
   END BREAK
   POST /api/attendance/break/end  { shiftId }
══════════════════════════════════════════════════════════════════ */
exports.endBreak = async (req, res) => {
    try {
        const { shiftId } = req.body;
        const targetId = req.body.employeeId || req.user.id;

        const shift = await Shift.findById(shiftId);
        if (!shift) return res.status(404).json({ status: "N", error: "Shift not found" });

        const att = shift.attendance.find(a => a.employee.toString() === targetId.toString());
        if (!att || att.status !== "on_break")
            return res.status(400).json({ status: "N", error: "Not currently on break" });

        const now = new Date();

        /* Close the open break */
        const openBreak = att.breaks.find(b => !b.end);
        if (openBreak) openBreak.end = now;

        /* Open a new work session */
        att.workSessions.push({ checkIn: now });
        att.status = "checked_in";

        recalc(att, shift.shiftStartTime, shift.shiftEndTime);
        await shift.save();

        res.json({ status: "Y", message: "Break ended — back to work", data: att });
    } catch (err) {
        res.status(500).json({ status: "N", error: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════
   GET ATTENDANCE FOR A SHIFT (Manager)
   GET /api/attendance/shift/:shiftId
══════════════════════════════════════════════════════════════════ */
exports.getShiftAttendance = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.shiftId)
            .populate("attendance.employee", "username email profileImage")
            .populate("acceptedEmployees", "username email profileImage");

        if (!shift) return res.status(404).json({ status: "N", error: "Shift not found" });

        /* Merge: include all accepted employees, not just those with records */
        const records = shift.acceptedEmployees.map(emp => {
            const att = shift.attendance.find(a => a.employee?._id?.toString() === emp._id.toString());
            if (att) {
                recalc(att, shift.shiftStartTime, shift.shiftEndTime);
                return { ...att.toObject(), employee: emp };
            }
            return {
                employee: emp,
                status: "not_started",
                workSessions: [], breaks: [],
                totalWorkMinutes: 0, totalBreakMinutes: 0,
                isLate: false, lateByMins: 0, leftEarly: false,
            };
        });

        res.json({
            status: "Y",
            data: {
                shift: { _id: shift._id, shiftTitle: shift.shiftTitle, shiftStartTime: shift.shiftStartTime, shiftEndTime: shift.shiftEndTime },
                attendance: records,
            },
        });
    } catch (err) {
        res.status(500).json({ status: "N", error: err.message });
    }
};

/* ══════════════════════════════════════════════════════════════════
   GET MY ATTENDANCE FOR A SHIFT (Employee)
   GET /api/attendance/my/:shiftId
══════════════════════════════════════════════════════════════════ */
exports.getMyAttendance = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.shiftId);
        if (!shift) return res.status(404).json({ status: "N", error: "Shift not found" });

        const att = shift.attendance.find(a => a.employee.toString() === req.user.id.toString());

        if (!att) {
            return res.json({
                status: "Y",
                data: {
                    shift: { _id: shift._id, shiftTitle: shift.shiftTitle, shiftStartTime: shift.shiftStartTime, shiftEndTime: shift.shiftEndTime },
                    attendance: { status: "not_started", workSessions: [], breaks: [], totalWorkMinutes: 0, totalBreakMinutes: 0 },
                },
            });
        }

        recalc(att, shift.shiftStartTime, shift.shiftEndTime);

        res.json({
            status: "Y",
            data: {
                shift: { _id: shift._id, shiftTitle: shift.shiftTitle, shiftStartTime: shift.shiftStartTime, shiftEndTime: shift.shiftEndTime },
                attendance: att,
            },
        });
    } catch (err) {
        res.status(500).json({ status: "N", error: err.message });
    }
};
