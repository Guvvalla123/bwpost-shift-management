import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { useAuth } from "@/context/useAuth";
import {
  Clock, CalendarDays, LogIn, LogOut, Coffee, ChevronDown,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { SkeletonCard, ErrorState } from "@/components/ui";

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }) : "—";

const formatDuration = (minutes) => {
  if (minutes == null || Number.isNaN(minutes)) return "—";
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} minutes`;
  return r === 0 ? `${h} hours` : `${h} hours ${r} minutes`;
};

const isShiftActive = (shift) => {
  const now = Date.now();
  const start = new Date(shift.shiftStartTime).getTime();
  const end = new Date(shift.shiftEndTime).getTime();
  const windowStart = now + 2 * 60 * 60 * 1000;
  return start <= windowStart && end >= now;
};

const STATUS_BADGE = {
  not_started: { label: "Not Started", cls: "bg-slate-100 text-slate-700" },
  checked_in: { label: "Checked In", cls: "bg-emerald-100 text-emerald-700" },
  on_break: { label: "On Break", cls: "bg-amber-100 text-amber-700" },
  checked_out: { label: "Completed", cls: "bg-blue-100 text-blue-700" },
};

const EmployeeCheckIn = () => {
  const { user } = useAuth();
  const [todayShifts, setTodayShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [attendanceError, setAttendanceError] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [showBreakMenu, setShowBreakMenu] = useState(false);
  const [weeklyInfo, setWeeklyInfo] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get("/api/attendance/weekly-hours");
        const d = res.data?.data;
        if (!cancelled && d && typeof d.totalMinutes === "number") {
          setWeeklyInfo(d);
        }
      } catch {
        if (!cancelled) setWeeklyInfo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchShiftsList = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ page: "1", limit: "20" });
      const res = await API.get(`/api/employee/shifts/myshifts?${params}`);
      const raw = Array.isArray(res.data?.data) ? res.data.data : [];
      const active = raw.filter(isShiftActive);
      setTodayShifts(active);
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
  }, []);

  useEffect(() => {
    fetchShiftsList();
  }, [fetchShiftsList]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedShiftId) {
      setShiftInfo(null);
      setAttendance(null);
      return;
    }
    setAttendanceLoading(true);
    setAttendanceError(false);
    try {
      const res = await API.get(`/api/attendance/my/${selectedShiftId}`);
      const payload = res.data?.data;
      setShiftInfo(payload?.shift || null);
      setAttendance(payload?.attendance ?? null);
    } catch {
      setAttendanceError(true);
      setShiftInfo(null);
      setAttendance(null);
    } finally {
      setAttendanceLoading(false);
    }
  }, [selectedShiftId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const status = attendance?.status || "not_started";
  const badge = STATUS_BADGE[status] || STATUS_BADGE.not_started;

  const firstCheckIn = useMemo(() => {
    const ws = attendance?.workSessions;
    if (!ws?.length) return attendance?.checkIn || null;
    return ws[0]?.checkIn || attendance?.checkIn || null;
  }, [attendance]);

  const lastCheckOut = attendance?.checkOut || null;

  const minutesSinceCheckIn = useMemo(() => {
    if (status !== "checked_in" && status !== "on_break") return null;
    if (!firstCheckIn) return null;
    return (currentTime - new Date(firstCheckIn)) / 60000;
  }, [status, firstCheckIn, currentTime]);

  const openBreak = useMemo(() => attendance?.breaks?.find((b) => !b.end), [attendance]);

  const breakDurationMins = useMemo(() => {
    if (status !== "on_break" || !openBreak?.start) return null;
    return (currentTime - new Date(openBreak.start)) / 60000;
  }, [status, openBreak, currentTime]);

  const shiftProgressPct = useMemo(() => {
    const s = shiftInfo || todayShifts.find((x) => x._id === selectedShiftId);
    if (!s?.shiftStartTime || !s?.shiftEndTime) return 0;
    const start = new Date(s.shiftStartTime).getTime();
    const end = new Date(s.shiftEndTime).getTime();
    const now = currentTime.getTime();
    if (end <= start) return 0;
    const pct = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [shiftInfo, todayShifts, selectedShiftId, currentTime]);

  const runAction = async (fn) => {
    if (!selectedShiftId) return;
    setActionLoading(true);
    try {
      await fn();
      await fetchAttendance();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = () =>
    runAction(async () => {
      await API.post("/api/attendance/checkin", { shiftId: selectedShiftId });
      toast.success("Checked in successfully");
    });

  const handleCheckOut = () =>
    runAction(async () => {
      await API.post("/api/attendance/checkout", { shiftId: selectedShiftId });
      toast.success("Checked out successfully");
      setShowCheckoutConfirm(false);
    });

  const handleStartBreak = (type) =>
    runAction(async () => {
      await API.post("/api/attendance/break/start", { shiftId: selectedShiftId, type });
      toast.success("Break started");
      setShowBreakMenu(false);
    });

  const handleEndBreak = () =>
    runAction(async () => {
      await API.post("/api/attendance/break/end", { shiftId: selectedShiftId });
      toast.success("Break ended, back to work");
    });

  const displayShift = shiftInfo || todayShifts.find((x) => x._id === selectedShiftId);

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
        <ErrorState title="Failed to load shifts" message="Could not load your shifts. Please try again." onRetry={fetchShiftsList} />
      </div>
    );
  }

  if (todayShifts.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-8">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Clock className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-bold text-slate-900">No active shift right now</h1>
          <p className="mt-2 text-sm text-slate-500">
            There is no shift starting within the next two hours or in progress. Check back when you are scheduled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check In</h1>
          <p className="mt-1 text-sm text-gray-400">
            {user?.username ? `Hi ${user.username} — ` : ""}
            Record attendance for your shift
          </p>
        </div>

        {weeklyInfo && (
          <div
            className={`rounded-2xl border px-4 py-3 shadow-sm ${
              weeklyInfo.totalMinutes >= 40 * 60
                ? "border-slate-200 bg-slate-100/90 text-slate-700"
                : weeklyInfo.totalMinutes >= 35 * 60
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">This week</p>
            <p className="mt-1 text-sm font-medium tabular-nums">
              {(weeklyInfo.totalMinutes / 60).toFixed(1)} hrs this week
              {weeklyInfo.totalMinutes >= 40 * 60
                ? " (40 hr limit reached)"
                : ` (${(weeklyInfo.remainingMinutes / 60).toFixed(1)} hrs remaining to 40hr limit)`}
            </p>
          </div>
        )}

        {todayShifts.length > 1 && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">Select shift</label>
            <div className="relative">
              <select
                value={selectedShiftId || ""}
                onChange={(e) => setSelectedShiftId(e.target.value || null)}
                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30"
              >
                <option value="">Choose a shift</option>
                {todayShifts.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.shiftTitle} · {formatTime(s.shiftStartTime)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        {!selectedShiftId && todayShifts.length > 1 && (
          <p className="flex items-center gap-2 text-base text-amber-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Select a shift to continue.
          </p>
        )}

        {selectedShiftId && displayShift && (
          <div className="overflow-hidden rounded-2xl bg-[#1B3F8B] text-white shadow-lg">
            <div className="p-5 sm:p-6">
              <p className="text-xs font-medium text-white/70">Current shift</p>
              <h2 className="mt-1 text-xl font-bold leading-tight sm:text-2xl">{displayShift.shiftTitle}</h2>
              <p className="mt-2 text-sm text-white/85">
                {formatTime(displayShift.shiftStartTime)} – {formatTime(displayShift.shiftEndTime)}
              </p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-white/70">
                  <span>Shift progress</span>
                  <span className="tabular-nums">{Math.round(shiftProgressPct)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${shiftProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedShiftId && attendanceLoading && <SkeletonCard lines={3} />}

        {selectedShiftId && attendanceError && !attendanceLoading && (
          <ErrorState title="Failed to load attendance" message="Could not load your attendance for this shift." onRetry={fetchAttendance} />
        )}

        {selectedShiftId && !attendanceLoading && !attendanceError && shiftInfo && attendance && (
          <>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <span className="text-sm text-slate-600">Status</span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
            </div>

            {status === "not_started" && (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="flex h-14 min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] text-white shadow-md transition hover:bg-[#162d5e] disabled:opacity-60"
              >
                <Clock className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span className="text-sm font-bold">Check In</span>
              </button>
            )}

            {(status === "checked_in" || status === "on_break") && (
              <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Checked in</p>
                    {firstCheckIn ? (
                      <p className="text-sm text-emerald-800">
                        Checked in at {formatTime(firstCheckIn)}
                      </p>
                    ) : null}
                    {minutesSinceCheckIn != null && status === "checked_in" ? (
                      <p className="mt-1 text-sm text-emerald-800">
                        Time worked: {formatDuration(minutesSinceCheckIn)}
                      </p>
                    ) : null}
                    {breakDurationMins != null && status === "on_break" ? (
                      <p className="mt-1 text-sm text-amber-800">On break: {formatDuration(breakDurationMins)}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {status === "checked_in" && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:flex-1">
                  <button
                    type="button"
                    onClick={() => setShowBreakMenu((v) => !v)}
                    disabled={actionLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Coffee className="h-5 w-5 shrink-0" />
                    Start Break
                  </button>
                  {showBreakMenu && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Close menu"
                        onClick={() => setShowBreakMenu(false)}
                      />
                      <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-slate-200 bg-white py-1 text-base shadow-lg">
                        <button
                          type="button"
                          className="w-full min-h-11 px-4 py-3 text-left hover:bg-slate-50"
                          onClick={() => handleStartBreak("lunch")}
                        >
                          Lunch Break
                        </button>
                        <button
                          type="button"
                          className="w-full min-h-11 px-4 py-3 text-left hover:bg-slate-50"
                          onClick={() => handleStartBreak("short_break")}
                        >
                          Short Break
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckoutConfirm(true)}
                  disabled={actionLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white transition hover:bg-[#162d5e] disabled:opacity-60 sm:flex-1"
                >
                  <Clock className="h-5 w-5 shrink-0" />
                  Check Out
                </button>
              </div>
            )}

            {status === "on_break" && (
              <button
                type="button"
                onClick={handleEndBreak}
                disabled={actionLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white transition hover:bg-[#162d5e] disabled:opacity-60"
              >
                End Break
              </button>
            )}

            {(status === "checked_in" || status === "on_break") && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Today</p>
                <dl className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Check in</dt>
                    <dd className="font-medium">{firstCheckIn ? formatTime(firstCheckIn) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Check out</dt>
                    <dd className="font-medium">{lastCheckOut ? formatTime(lastCheckOut) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Total worked</dt>
                    <dd className="font-semibold tabular-nums">
                      {attendance.totalWorkMinutes != null ? formatDuration(attendance.totalWorkMinutes) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {status === "checked_out" && (
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                <div className="flex items-center gap-2 text-base font-bold text-emerald-800">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                  Shift complete
                </div>
                <dl className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Check in</dt>
                    <dd className="font-medium">{firstCheckIn ? formatTime(firstCheckIn) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Check out</dt>
                    <dd className="font-medium">{lastCheckOut ? formatTime(lastCheckOut) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Total hours</dt>
                    <dd className="font-semibold">{formatDuration(attendance.totalWorkMinutes)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </>
        )}
      </div>

      {showCheckoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setShowCheckoutConfirm(false)}
        >
          <div
            className="mx-0 flex min-h-full w-full flex-col justify-center bg-white p-6 sm:min-h-0 sm:max-w-md sm:rounded-2xl sm:shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-slate-800">Check out now?</p>
            <p className="mt-2 text-base text-slate-500">This will end your work session for this shift.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowCheckoutConfirm(false)}
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-base font-semibold text-slate-700 hover:bg-slate-50 sm:flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="min-h-12 w-full rounded-xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-60 sm:flex-1"
              >
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCheckIn;
