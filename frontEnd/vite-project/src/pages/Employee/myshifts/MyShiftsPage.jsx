// MyShiftsPage.jsx
// Shows all shifts the employee is assigned to.
// Employee can view details or request leave / shift change for upcoming shifts.
//
// THIS FILE MANAGES STATE AND DATA.
// UI pieces are in separate component files:
// - MyShiftCard.jsx     shows one shift as a card on mobile
// - MyShiftDetails.jsx  side panel with full shift details
// - CancelShiftModal.jsx  modal for leave and shift-change requests

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  Pagination, SkeletonTable, SkeletonList,
  EmptyState, ErrorState, Badge,
} from "@/components/ui";
import {
  Calendar, CalendarDays, Clock, Briefcase,
  ArrowRightLeft, LogOut as LeaveIcon,
} from "lucide-react";
import { getStatus } from "@/utils/shiftStatus";

// Import API functions
import {
  getMyShifts,
  getAvailableShifts,
  submitLeaveRequest,
  submitShiftChangeRequest,
} from "./myShiftsApi";

// Import sub-components
import MyShiftCard     from "./MyShiftCard";
import MyShiftDetails  from "./MyShiftDetails";
import CancelShiftModal from "./CancelShiftModal";

// ── Date helpers ───────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// STATUS_CFG - badge and dot styles per shift status
const STATUS_CFG = {
  upcoming:  { label: "Upcoming",  cls: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  ongoing:   { label: "Ongoing",   cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" },
  completed: { label: "Completed", cls: "bg-slate-100 text-gray-500",   dot: "bg-slate-400" },
};

// ── Main Component ─────────────────────────────────────────────
const MyShiftsPage = () => {
  const navigate = useNavigate();

  // List of my shifts from server
  const [shifts, setShifts] = useState([]);

  // All available shifts (for the shift-change dropdown in modal)
  const [allShifts, setAllShifts] = useState([]);

  // True while loading shifts
  const [loading, setLoading] = useState(true);

  // True if last load failed
  const [fetchError, setFetchError] = useState(false);

  // Current filter tab: "all" | "upcoming" | "ongoing" | "completed"
  const [activeFilter, setActiveFilter] = useState("all");

  // Total count for pagination
  const [total, setTotal] = useState(0);

  // Total pages for pagination
  const [totalPages, setTotalPages] = useState(1);

  // Current page number
  const [currentPage, setCurrentPage] = useState(1);

  // The shift being viewed in the side panel — null means panel is closed
  const [selectedShift, setSelectedShift] = useState(null);

  // The shift being cancelled/changed — when set, opens CancelShiftModal
  // Shape: { shift, type } where type is "leave" | "shift_change"
  const [shiftToCancel, setShiftToCancel] = useState(null);

  // True while submitting the leave/shift-change request
  const [isCancelling, setIsCancelling] = useState(false);

  // When the data was last fetched (shown on mobile)
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  // Auto-refresh interval reference
  const refreshTimerRef = useRef(null);

  // ── Load data when page or filter changes ──────────────────
  useEffect(() => {
    loadMyShifts();
  }, [currentPage]);

  // ── Auto-refresh every 60 seconds ─────────────────────────
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      loadMyShiftsSilent();
    }, 60_000);
    return () => clearInterval(refreshTimerRef.current);
  }, [currentPage]);

  // ── Functions ──────────────────────────────────────────────

  // loadMyShifts - fetches my shifts and available shifts in parallel
  async function loadMyShifts() {
    setLoading(true);
    setFetchError(false);
    try {
      const [myResult, available] = await Promise.all([
        getMyShifts(currentPage),
        getAvailableShifts(),
      ]);
      setShifts(myResult.shifts);
      setTotalPages(myResult.totalPages);
      setTotal(myResult.total);
      setAllShifts(available);
      setLastUpdated(new Date());
    } catch {
      setFetchError(true);
      setShifts([]);
      setAllShifts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // loadMyShiftsSilent - refreshes without showing loading spinner
  async function loadMyShiftsSilent() {
    try {
      const [myResult, available] = await Promise.all([
        getMyShifts(currentPage),
        getAvailableShifts(),
      ]);
      setShifts(myResult.shifts);
      setTotalPages(myResult.totalPages);
      setTotal(myResult.total);
      setAllShifts(available);
      setLastUpdated(new Date());
    } catch { /* keep previous */ }
  }

  // handleViewShift - opens the details side panel for a shift
  // shift - the shift object to show in the panel
  function handleViewShift(shift) {
    setSelectedShift(shift);
  }

  // handleCloseDetails - closes the details side panel
  function handleCloseDetails() {
    setSelectedShift(null);
  }

  // handleCancelClick - opens CancelShiftModal for a leave request
  // shift - the upcoming shift the employee wants to leave
  function handleCancelClick(shift) {
    setShiftToCancel({ shift, type: "leave" });
  }

  // handleChangeClick - opens CancelShiftModal for a shift-change request
  // shift - the upcoming shift the employee wants to change
  function handleChangeClick(shift) {
    setShiftToCancel({ shift, type: "shift_change" });
  }

  // handleConfirmCancel - submits the leave or shift-change request to the API
  // type - "leave" | "shift_change"
  // data - { reason } for leave, { requestedShiftId, reason } for shift_change
  async function handleConfirmCancel(type, data) {
    if (!shiftToCancel) return;
    setIsCancelling(true);
    try {
      if (type === "leave") {
        await submitLeaveRequest(shiftToCancel.shift._id, data.reason);
        toast.success("Leave request submitted!");
      } else {
        if (!data.requestedShiftId) {
          toast.error("Please select a shift to switch to");
          return;
        }
        await submitShiftChangeRequest(
          shiftToCancel.shift._id,
          data.requestedShiftId,
          data.reason
        );
        toast.success("Shift change request submitted!");
      }
      setShiftToCancel(null);
      loadMyShifts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit request"));
    } finally {
      setIsCancelling(false);
    }
  }

  // handleFilterChange - changes the active filter tab
  // filter - "all" | "upcoming" | "ongoing" | "completed"
  function handleFilterChange(filter) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  // handlePageChange - changes the current pagination page
  // page - the page number to navigate to
  function handlePageChange(page) {
    setCurrentPage(page);
  }

  // ── Client-side filter by status ───────────────────────────
  // The API returns all shifts; we filter by status on the client
  const filtered =
    activeFilter === "all"
      ? shifts
      : shifts.filter((s) => getStatus(s.shiftStartTime, s.shiftEndTime) === activeFilter);

  // Count per tab for the badge numbers
  const counts = {
    all:       shifts.length,
    upcoming:  shifts.filter((s) => getStatus(s.shiftStartTime, s.shiftEndTime) === "upcoming").length,
    ongoing:   shifts.filter((s) => getStatus(s.shiftStartTime, s.shiftEndTime) === "ongoing").length,
    completed: shifts.filter((s) => getStatus(s.shiftStartTime, s.shiftEndTime) === "completed").length,
  };

  // Manager name helper for desktop table
  function getManagerLabel(shift) {
    const m = shift?.manager || shift?.managerId;
    if (!m) return null;
    if (typeof m === "object") return m.username || m.email || null;
    return null;
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <div className="hidden md:block"><SkeletonTable rows={5} cols={5} /></div>
        <div className="md:hidden"><SkeletonList count={5} /></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load your shifts"
          description="Could not load your shift history. Please try again."
          onRetry={loadMyShifts}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
          <p className="text-sm text-gray-500 mt-1">All shifts you are assigned to</p>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { key: "all",       label: "All" },
          { key: "upcoming",  label: "Upcoming" },
          { key: "ongoing",   label: "Ongoing" },
          { key: "completed", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleFilterChange(tab.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? "bg-[#1B3F8B] text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {tab.label}
            <span className={`text-xs font-semibold tabular-nums ${
              activeFilter === tab.key ? "text-white/90" : "text-gray-500"
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {shifts.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No shifts yet"
          description="You have not been assigned to any shifts yet."
          actionLabel="Browse available shifts"
          onAction={() => navigate("/employee/AllShifts")}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16">
          <Calendar size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            No {activeFilter !== "all" ? activeFilter : ""} shifts on this page
          </p>
        </div>
      ) : (
        <>
          {/* ── MOBILE: MyShiftCard list ── */}
          <div className="md:hidden space-y-3">
            {filtered.map((shift) => (
              <MyShiftCard
                key={shift._id}
                shift={shift}
                onViewDetails={handleViewShift}
                onRequestLeave={handleCancelClick}
                onRequestChange={handleChangeClick}
              />
            ))}
          </div>

          {/* ── DESKTOP: Full table ── */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Start</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">End</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((shift) => {
                  const status = getStatus(shift.shiftStartTime, shift.shiftEndTime);
                  const cfg    = STATUS_CFG[status] || STATUS_CFG.completed;
                  return (
                    <tr
                      key={shift._id}
                      className="hover:bg-slate-50/60 transition-colors duration-100 cursor-pointer"
                      onClick={() => handleViewShift(shift)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{shift.shiftTitle}</p>
                        {shift.shiftNotes && (
                          <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{shift.shiftNotes}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {fmtDate(shift.shiftStartTime)} {fmtTime(shift.shiftStartTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {fmtTime(shift.shiftEndTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getManagerLabel(shift) || "—"}
                      </td>
                      <td
                        className="px-6 py-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {status === "upcoming" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleChangeClick(shift)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all duration-150 active:scale-95"
                            >
                              <ArrowRightLeft size={13} />
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelClick(shift)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all duration-150 active:scale-95"
                            >
                              <LeaveIcon size={13} />
                              Leave
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Pagination and last updated ── */}
      {!loading && !fetchError && shifts.length > 0 && (
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={20}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
          <p className="text-xs text-gray-400 text-center py-3 md:hidden">
            Updated{" "}
            {lastUpdated.toLocaleTimeString("en-DE", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </>
      )}

      {/* ── Side panel: MyShiftDetails ── */}
      <MyShiftDetails shift={selectedShift} onClose={handleCloseDetails} />

      {/* ── Cancel/Change modal ── */}
      <CancelShiftModal
        isOpen={!!shiftToCancel}
        shift={shiftToCancel?.shift}
        type={shiftToCancel?.type}
        allShifts={allShifts}
        isCancelling={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShiftToCancel(null)}
      />
    </div>
  );
};

export default MyShiftsPage;
