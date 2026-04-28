// CheckInPage.jsx
// Main check-in page for employees.
// Employee selects their shift and checks in, starts breaks, and checks out.
//
// THIS FILE MANAGES STATE AND DATA.
// UI pieces are in separate component files:
// - ShiftSelector.jsx  - shift dropdown (shown when >1 shifts)
// - ActiveShiftCard.jsx - blue card showing shift + progress bar
// - CheckInButton.jsx   - all action buttons (check in/out/break)
// - WeeklyHoursCard.jsx - weekly hours summary card

import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { SkeletonCard, ErrorState, EmptyState } from "@/components/ui";
import { Clock, Loader2 } from "lucide-react";

// Import all API functions
import {
  getMyShifts,
  getAttendance,
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  getWeeklyHours,
} from "./checkinApi";

// Import sub-components
import ShiftSelector   from "./ShiftSelector";
import ActiveShiftCard from "./ActiveShiftCard";
import CheckInButton   from "./CheckInButton";
import WeeklyHoursCard from "./WeeklyHoursCard";

// isShiftActive - checks if a shift is currently active or starting soon
// A shift is "active" if it has started (or starts within 2 hours) and not ended.
function isShiftActive(shift) {
  const now         = Date.now();
  const start       = new Date(shift.shiftStartTime).getTime();
  const end         = new Date(shift.shiftEndTime).getTime();
  const windowStart = now + 2 * 60 * 60 * 1000; // 2 hours ahead
  return start <= windowStart && end >= now;
}

// ── Main Component ─────────────────────────────────────────────
const CheckInPage = () => {
  // List of today's active shifts for this employee
  const [todayShifts, setTodayShifts] = useState([]);

  // The _id of the currently selected shift
  // null means nothing is selected yet
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  // Full shift info returned alongside attendance data
  const [shiftInfo, setShiftInfo] = useState(null);

  // Current attendance record for the selected shift
  // null means employee has not checked in to this shift yet
  const [attendance, setAttendance] = useState(null);

  // True while loading the shifts list (shows skeleton)
  const [loading, setLoading] = useState(true);

  // True while loading attendance for the selected shift
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // True while a check-in/out/break action is running
  const [actionLoading, setActionLoading] = useState(false);

  // True if the initial shifts fetch fails
  const [fetchError, setFetchError] = useState(false);

  // True if the attendance fetch for selected shift fails
  const [attendanceError, setAttendanceError] = useState(false);

  // True when the checkout confirmation dialog is visible
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  // Live clock — updates every second to power the progress bar
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Weekly hours data for the WeeklyHoursCard
  const [weeklyInfo, setWeeklyInfo] = useState(null);

  // Auto-refresh interval reference
  const refreshTimerRef = useRef(null);

  // ── Live clock: update every second ───────────────────────
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Load weekly hours once on page open ───────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getWeeklyHours();
        if (!cancelled) setWeeklyInfo(data);
      } catch {
        if (!cancelled) setWeeklyInfo(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Load shifts list on page open ─────────────────────────
  useEffect(() => {
    loadTodayShifts();
  }, []);

  // ── Load attendance when selected shift changes ────────────
  useEffect(() => {
    loadAttendance(selectedShiftId);
  }, [selectedShiftId]);

  // ── Auto-refresh shifts + attendance every 30 seconds ─────
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      loadShiftsSilent();
    }, 30_000);
    return () => clearInterval(refreshTimerRef.current);
  }, [selectedShiftId]);

  // ── Functions ──────────────────────────────────────────────

  // loadTodayShifts - fetches the employee's active shifts with loading spinner
  async function loadTodayShifts() {
    setLoading(true);
    setFetchError(false);
    try {
      const all    = await getMyShifts();
      const active = all.filter(isShiftActive);
      setTodayShifts(active);
      // Auto-select if there is exactly one shift
      if (active.length === 1) {
        setSelectedShiftId(active[0]._id);
      } else {
        setSelectedShiftId(null);
      }
    } catch {
      setFetchError(true);
      setTodayShifts([]);
      setSelectedShiftId(null);
    } finally {
      setLoading(false);
    }
  }

  // loadAttendance - fetches attendance record for the given shift
  // shiftId - the _id of the shift to check, or null to clear
  async function loadAttendance(shiftId) {
    if (!shiftId) {
      setShiftInfo(null);
      setAttendance(null);
      return;
    }
    setAttendanceLoading(true);
    setAttendanceError(false);
    try {
      const result = await getAttendance(shiftId);
      setShiftInfo(result.shift);
      setAttendance(result.attendance);
    } catch {
      setAttendanceError(true);
      setShiftInfo(null);
      setAttendance(null);
    } finally {
      setAttendanceLoading(false);
    }
  }

  // loadShiftsSilent - refreshes shifts and attendance without loading spinner
  async function loadShiftsSilent() {
    try {
      const all = await getMyShifts();
      setTodayShifts(all.filter(isShiftActive));
    } catch { /* silent */ }
    if (!selectedShiftId) return;
    try {
      const result = await getAttendance(selectedShiftId);
      setShiftInfo(result.shift);
      setAttendance(result.attendance);
    } catch { /* silent */ }
  }

  // loadWeeklyHours - refreshes the weekly hours summary
  async function loadWeeklyHours() {
    try {
      const data = await getWeeklyHours();
      setWeeklyInfo(data);
    } catch { /* keep previous */ }
  }

  // runAction - helper that wraps any attendance action with loading state
  // fn - async function to run (the actual API call)
  async function runAction(fn) {
    if (!selectedShiftId) return;
    setActionLoading(true);
    try {
      await fn();
      await loadAttendance(selectedShiftId);
      await loadWeeklyHours();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setActionLoading(false);
    }
  }

  // handleCheckIn - employee checks in to the selected shift
  async function handleCheckIn() {
    await runAction(async () => {
      await checkIn(selectedShiftId);
      toast.success("Checked in successfully");
    });
  }

  // handleCheckOut - employee checks out from the selected shift
  // Called after manager confirms in the checkout dialog
  async function handleCheckOut() {
    await runAction(async () => {
      await checkOut(selectedShiftId);
      toast.success("Checked out successfully");
      setShowCheckoutConfirm(false);
    });
  }

  // handleStartBreak - employee starts a break
  // breakType - "lunch" | "short_break"
  async function handleStartBreak(breakType) {
    await runAction(async () => {
      await startBreak(selectedShiftId, breakType);
      toast.success("Break started");
    });
  }

  // handleEndBreak - employee ends their current break
  async function handleEndBreak() {
    await runAction(async () => {
      await endBreak(selectedShiftId);
      toast.success("Break ended, back to work");
    });
  }

  // handleShiftSelect - called when employee picks a shift from the dropdown
  // shiftId - the _id of the selected shift, or null for none
  function handleShiftSelect(shiftId) {
    setSelectedShiftId(shiftId || null);
  }

  // ── Computed values for the child components ───────────────

  // The shift object to display (from attendance response or shift list)
  const displayShift = shiftInfo || todayShifts.find((x) => x._id === selectedShiftId);

  // Shift progress percentage based on current time
  const shiftProgressPct = useMemo(() => {
    const s = displayShift;
    if (!s?.shiftStartTime || !s?.shiftEndTime) return 0;
    const start = new Date(s.shiftStartTime).getTime();
    const end   = new Date(s.shiftEndTime).getTime();
    const now   = currentTime.getTime();
    if (end <= start) return 0;
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }, [displayShift, currentTime]);

  // Timestamp of the very first check-in (from work sessions array)
  const firstCheckIn = useMemo(() => {
    const ws = attendance?.workSessions;
    if (ws?.length) return ws[0]?.checkIn || attendance?.checkIn || null;
    return attendance?.checkIn || null;
  }, [attendance]);

  // Timestamp of the last check-out
  const lastCheckOut = attendance?.checkOut || null;

  // How many minutes since check-in (for "time worked" display)
  const minutesSinceIn = useMemo(() => {
    const status = attendance?.status;
    if (status !== "checked_in" && status !== "on_break") return null;
    if (!firstCheckIn) return null;
    return (currentTime - new Date(firstCheckIn)) / 60000;
  }, [attendance?.status, firstCheckIn, currentTime]);

  // The current open break record (has start but no end)
  const openBreak = useMemo(() =>
    attendance?.breaks?.find((b) => !b.end), [attendance]);

  // How many minutes the current break has lasted
  const breakDurationMins = useMemo(() => {
    if (attendance?.status !== "on_break" || !openBreak?.start) return null;
    return (currentTime - new Date(openBreak.start)) / 60000;
  }, [attendance?.status, openBreak, currentTime]);

  // ── Early returns for loading / error / empty states ───────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] p-6">
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] p-6">
        <ErrorState
          title="Failed to load shifts"
          description="Could not load your shifts. Please try again."
          onRetry={loadTodayShifts}
        />
      </div>
    );
  }

  if (todayShifts.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-8">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white shadow-sm">
          <EmptyState
            icon={Clock}
            title="No active shift right now"
            description="You will be able to check in when your shift starts."
          />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">

        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Check In</h1>
            <p className="text-sm text-gray-500 mt-1">Record your attendance for today</p>
          </div>
        </div>

        {/* Weekly hours card — color changes near the 40hr limit */}
        <WeeklyHoursCard weeklyInfo={weeklyInfo} limitHours={40} />

        {/* Shift selector — only shown when there are multiple shifts */}
        <ShiftSelector
          shifts={todayShifts}
          selectedShiftId={selectedShiftId}
          onSelectShift={handleShiftSelect}
        />

        {/* Active shift card with blue background and progress bar */}
        {selectedShiftId && displayShift && (
          <ActiveShiftCard shift={displayShift} progressPct={shiftProgressPct} />
        )}

        {/* Loading state for attendance */}
        {selectedShiftId && attendanceLoading && (
          <SkeletonCard lines={3} />
        )}

        {/* Error state for attendance */}
        {selectedShiftId && attendanceError && !attendanceLoading && (
          <ErrorState
            title="Failed to load attendance"
            description="Could not load your attendance for this shift."
            onRetry={() => loadAttendance(selectedShiftId)}
          />
        )}

        {/* Action buttons — only shown after attendance loads */}
        {selectedShiftId && !attendanceLoading && !attendanceError && shiftInfo && (
          <CheckInButton
            attendance={attendance}
            isLoading={actionLoading}
            firstCheckIn={firstCheckIn}
            lastCheckOut={lastCheckOut}
            minutesSinceIn={minutesSinceIn}
            breakDurationMins={breakDurationMins}
            onCheckIn={handleCheckIn}
            onCheckOut={() => setShowCheckoutConfirm(true)}
            onStartBreak={handleStartBreak}
            onEndBreak={handleEndBreak}
          />
        )}
      </div>

      {/* ── Checkout confirmation dialog ── */}
      {showCheckoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setShowCheckoutConfirm(false)}
        >
          <div
            className="mx-0 flex min-h-full w-full flex-col justify-center bg-white p-6 sm:min-h-0 sm:max-w-md sm:rounded-2xl sm:shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-gray-800">Check out now?</p>
            <p className="mt-2 text-base text-gray-500">
              This will end your work session for this shift.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowCheckoutConfirm(false)}
                className="min-h-12 w-full rounded-xl border border-gray-200 px-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all sm:flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-60 sm:flex-1"
              >
                {actionLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                {actionLoading ? "Checking out…" : "Check Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
