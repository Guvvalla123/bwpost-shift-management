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
  if (h === 0) return `${r}m`;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
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

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
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

  const onTimeLabel = () => {
    if (!attendance) return "—";
    if (attendance.isLate) return "Late";
    if (attendance.leftEarly) return "Left early";
    return "On time";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] p-6">
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] p-6">
        <ErrorState
          title="Failed to load shifts"
          message="Could not load your shifts. Please try again."
          onRetry={fetchShiftsList}
        />
      </div>
    );
  }

  if (todayShifts.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] p-6">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900">No active shift today</h1>
          <p className="text-sm text-slate-500 mt-2">
            There is no shift starting within the next 2 hours or currently in progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] px-4 py-4 sm:p-6 max-w-7xl mx-auto">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Check In</h1>
          <p className="text-base text-slate-500 mt-0.5">
            {user?.username ? `Hi ${user.username} — ` : ""}
            Record attendance for your shift
          </p>
        </div>

        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-6 h-6 text-[#1B3F8B] shrink-0" />
              <span className="text-3xl sm:text-4xl font-bold tabular-nums text-slate-900">
                {currentTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
              </span>
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full self-start sm:self-auto ${badge.cls}`}>{badge.label}</span>
          </div>

          {todayShifts.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Select shift</label>
              <div className="relative">
                <select
                  value={selectedShiftId || ""}
                  onChange={(e) => setSelectedShiftId(e.target.value || null)}
                  className="w-full h-12 appearance-none px-4 rounded-lg border border-slate-200 text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]"
                >
                  <option value="">— Choose a shift —</option>
                  {todayShifts.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.shiftTitle} · {formatTime(s.shiftStartTime)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {todayShifts.length === 1 && (shiftInfo?.shiftTitle || todayShifts[0]?.shiftTitle) && (
            <p className="text-base font-medium text-slate-800">{shiftInfo?.shiftTitle || todayShifts[0]?.shiftTitle}</p>
          )}

          {!selectedShiftId && todayShifts.length > 1 && (
            <p className="text-base text-amber-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              Select a shift to view attendance and actions.
            </p>
          )}

          {selectedShiftId && attendanceLoading && (
            <SkeletonCard lines={3} />
          )}

          {selectedShiftId && attendanceError && !attendanceLoading && (
            <ErrorState
              title="Failed to load attendance"
              message="Could not load your attendance for this shift."
              onRetry={fetchAttendance}
            />
          )}

          {selectedShiftId && !attendanceLoading && !attendanceError && shiftInfo && attendance && (
            <>
              <div className="text-base text-slate-600 space-y-2 border-t border-slate-100 pt-4">
                <p>
                  <span className="text-slate-400">Start:</span>{" "}
                  {formatTime(shiftInfo.shiftStartTime)} · {new Date(shiftInfo.shiftStartTime).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-slate-400">End:</span>{" "}
                  {formatTime(shiftInfo.shiftEndTime)} · {new Date(shiftInfo.shiftEndTime).toLocaleDateString()}
                </p>
                {minutesSinceCheckIn != null && status === "checked_in" && (
                  <p>
                    <span className="text-slate-400">Time since check-in:</span>{" "}
                    {formatDuration(minutesSinceCheckIn)}
                  </p>
                )}
                {breakDurationMins != null && status === "on_break" && (
                  <p>
                    <span className="text-slate-400">Break duration:</span> {formatDuration(breakDurationMins)}
                  </p>
                )}
              </div>

              {status === "checked_out" && (
                <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    Shift Complete
                  </div>
                  <dl className="text-base space-y-3 text-slate-700">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 w-full">
                      <dt className="text-slate-500 sm:text-slate-700">Total Work Time</dt>
                      <dd className="font-semibold tabular-nums">{formatDuration(attendance.totalWorkMinutes)}</dd>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 w-full">
                      <dt className="text-slate-500 sm:text-slate-700">Break Time</dt>
                      <dd className="font-semibold tabular-nums">{formatDuration(attendance.totalBreakMinutes)}</dd>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 w-full">
                      <dt className="text-slate-500 sm:text-slate-700">Check In</dt>
                      <dd className="font-medium">{formatTime(firstCheckIn)}</dd>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 w-full">
                      <dt className="text-slate-500 sm:text-slate-700">Check Out</dt>
                      <dd className="font-medium">{formatTime(lastCheckOut)}</dd>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 w-full">
                      <dt className="text-slate-500 sm:text-slate-700">Status</dt>
                      <dd className="font-medium">{onTimeLabel()}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {status === "not_started" && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#1B3F8B] hover:bg-[#162d5e] text-white rounded-2xl px-4 h-16 text-lg font-bold shadow-lg transition-colors disabled:opacity-60 min-h-[64px] sm:max-w-sm sm:mx-auto"
                >
                  <LogIn className="w-6 h-6 shrink-0" />
                  Check In
                </button>
              )}

              {status === "checked_in" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:flex-1">
                    <button
                      type="button"
                      onClick={() => setShowBreakMenu((v) => !v)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-3 text-base font-semibold transition-colors disabled:opacity-60 min-h-12"
                    >
                      <Coffee className="w-5 h-5 shrink-0" />
                      Start Break
                    </button>
                    {showBreakMenu && (
                      <>
                        <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setShowBreakMenu(false)} />
                        <div className="absolute left-0 right-0 mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-base">
                          <button
                            type="button"
                            className="w-full text-left px-4 py-3 min-h-11 hover:bg-slate-50"
                            onClick={() => handleStartBreak("lunch")}
                          >
                            Lunch Break
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-3 min-h-11 hover:bg-slate-50"
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
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-3 text-base font-semibold transition-colors disabled:opacity-60 min-h-12"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    Check Out
                  </button>
                </div>
              )}

              {status === "on_break" && (
                <button
                  type="button"
                  onClick={handleEndBreak}
                  disabled={actionLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1B3F8B] hover:bg-[#162d5e] text-white rounded-lg px-4 py-3 text-base font-semibold transition-colors disabled:opacity-60 min-h-12"
                >
                  End Break
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showCheckoutConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-stretch sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCheckoutConfirm(false)}
        >
          <div
            className="bg-white w-full min-h-full sm:min-h-0 sm:rounded-2xl sm:shadow-xl sm:max-w-md sm:w-full mx-0 sm:mx-4 p-6 flex flex-col justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-slate-800 font-semibold text-lg">Are you sure you want to check out?</p>
            <p className="text-base text-slate-500 mt-2">This will end your work session for this shift.</p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCheckoutConfirm(false)}
                className="w-full sm:flex-1 px-4 py-3 rounded-lg border border-slate-200 text-base font-semibold text-slate-700 hover:bg-slate-50 min-h-12"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="w-full sm:flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-base font-semibold disabled:opacity-60 min-h-12"
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
