import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Trash2, ChevronRight, Search, Clock, CalendarDays,
  UserCheck, Users, AlertTriangle, X
} from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-violet-600 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];
const avatarGradient = (name = "") =>
  AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";


/* ─── Main Component ─────────────────────────────────────── */
const ShiftRequest = () => {
  const [shifts, setShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");

  const [removingEmployee, setRemovingEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── API ── */
  const fetchShifts = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/manager/shifts?limit=200",
        { withCredentials: true }
      );
      setShifts(res.data.data || []);
      // Auto-select first shift if none selected and data exists
      if (!selectedShiftId && res.data.data?.length > 0) {
        setSelectedShiftId(res.data.data[0]._id);
      }
    } catch {
      toast.error("Failed to load shifts");
    } finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Filtered Shifts ── */
  const filteredShifts = shifts.filter((s) =>
    (s.shiftTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedShift = shifts.find((s) => s._id === selectedShiftId);

  /* ── Remove Employee Action ── */
  const handleRemoveEmployee = async () => {
    if (!selectedShiftId || !removingEmployee) return;

    setActionLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/manager/shifts/shift/remove-employee",
        { shiftId: selectedShiftId, employeeId: removingEmployee._id },
        { withCredentials: true }
      );
      toast.success("Employee removed successfully");
      setRemovingEmployee(null);
      fetchShifts(); // Refresh data to get updated counts & list
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove employee");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shift Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Review and manage employees assigned to your shifts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

          {/* ── Left Sidebar: Shifts List ──────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-24">

            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search shifts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loadingShifts ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl space-y-2 animate-pulse">
                    <div className="w-2/3 h-4 bg-slate-200 rounded" />
                    <div className="w-1/2 h-3 bg-slate-100 rounded" />
                  </div>
                ))
              ) : filteredShifts.length === 0 ? (
                <div className="py-10 text-center text-slate-400 px-4">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No shifts found matching your search.</p>
                </div>
              ) : (
                filteredShifts.map((shift) => {
                  const isActive = selectedShiftId === shift._id;
                  const empCount = shift.acceptedEmployees?.length || 0;
                  return (
                    <button
                      key={shift._id}
                      onClick={() => setSelectedShiftId(shift._id)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between group
                        ${isActive
                          ? "bg-blue-50 border border-blue-200 shadow-sm"
                          : "hover:bg-slate-50 border border-transparent"
                        }`}
                    >
                      <div className="min-w-0 pr-3">
                        <p className={`text-sm font-semibold truncate transition-colors ${isActive ? "text-blue-700" : "text-slate-900 group-hover:text-blue-600"}`}>
                          {shift.shiftTitle}
                        </p>
                        <p className={`text-xs mt-1 flex items-center gap-1.5 ${isActive ? "text-blue-600/80" : "text-slate-500"}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span className="truncate">{formatDate(shift.shiftStartTime)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`flex items-center justify-center min-w-[28px] h-7 rounded-lg text-xs font-bold
                          ${isActive ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700"}
                        `}>
                          {empCount}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "text-blue-600 translate-x-1" : "text-slate-300 opacity-0 group-hover:opacity-100"}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Content: Selected Shift Details ──────── */}
          <div className="space-y-6">
            {!selectedShift ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Shift Selected</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">Select a shift from the list on the left to review the assigned employees and manage their status.</p>
              </div>
            ) : (
              <>
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.03] rounded-bl-full group-hover:scale-110 transition-transform duration-500" />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedShift.shiftTitle}</h2>
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                          <CalendarDays className="w-4 h-4 text-blue-500" />
                          {formatDate(selectedShift.shiftStartTime)}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          {formatTime(selectedShift.shiftStartTime)} — {formatTime(selectedShift.shiftEndTime)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-blue-600/70 uppercase tracking-wider">Accepted</p>
                        <p className="text-2xl font-bold text-blue-700 leading-none mt-1">
                          {selectedShift.acceptedEmployees?.length || 0}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-blue-200 mx-1" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</p>
                        <p className="text-2xl font-bold text-slate-700 leading-none mt-1">
                          {selectedShift.slotsAvailable}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Assigned Roster</h3>
                  </div>

                  {selectedShift.acceptedEmployees?.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                      <UserCheck className="h-12 w-12 text-slate-200 mb-3" />
                      <p className="text-base font-medium text-slate-600">No employees accepted yet</p>
                      <p className="text-sm text-slate-400 mt-1">Once employees accept this shift, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedShift.acceptedEmployees.map((emp) => (
                            <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(emp.username)} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white`}>
                                    {initials(emp.username)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 leading-tight">{emp.username}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{emp.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Accepted
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => setRemovingEmployee(emp)}
                                  className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                  title="Remove from shift"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* REMOVE EMPLOYEE MODAL                              */}
      {/* ══════════════════════════════════════════════════ */}
      {removingEmployee && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setRemovingEmployee(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-8 border-red-100 flex items-center justify-center mb-5">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Remove Employee?</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Are you sure you want to remove <span className="font-bold text-slate-800">{removingEmployee.username}</span> from this shift?
                This will free up one slot.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setRemovingEmployee(null)}
                  disabled={actionLoading}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveEmployee}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 hover:shadow-lg transition-all duration-200 text-sm disabled:opacity-60 flex justify-center items-center"
                >
                  {actionLoading ? "Removing..." : "Yes, Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftRequest;
