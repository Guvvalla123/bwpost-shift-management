// ShiftsPage.jsx
// This is the main shifts page for managers.
// It shows a list of all shifts and lets the
// manager create, edit, and delete shifts.
//
// THIS FILE ONLY MANAGES STATE AND DATA.
// The actual UI is built by separate component files:
//   ShiftStats.jsx       — the 4 stat cards at the top
//   ShiftFilters.jsx     — the search bar and filter tabs
//   ShiftCard.jsx        — one shift card on mobile screens
//   ShiftTableRow.jsx    — one shift row on desktop table
//   ShiftDetails.jsx     — the slide-in side panel for shift details
//   ShiftDeleteConfirm.jsx — the delete confirmation dialog
//   CreateShiftModal.jsx — the create new shift form
//   EditShiftModal.jsx   — the edit existing shift form
//
// HOW DATA FLOWS:
//   ShiftsPage loads data → passes data as props to components
//   Components fire events → ShiftsPage handles them with functions
//   This is called "lifting state up" — the parent owns all data

import React, { useState, useEffect, useRef } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  DonutChart,
  SkeletonTable,
  SkeletonList,
  ErrorState,
  EmptyState,
} from "@/components/ui";
import { getStatus } from "@/utils/shiftStatus";

// API helper functions — all API calls live in shiftApi.js
import {
  getAllShifts,
  getStatusCounts,
  getDashboardData,
  createShift as apiCreateShift,
  updateShift as apiUpdateShift,
  deleteShift as apiDeleteShift,
} from "./shiftApi";

// Component files — each does one specific UI job
import ShiftStats from "./ShiftStats";
import ShiftFilters from "./ShiftFilters";
import ShiftCard from "./ShiftCard";
import ShiftTableRow from "./ShiftTableRow";
import ShiftDetails from "./ShiftDetails";
import ShiftDeleteConfirm from "./ShiftDeleteConfirm";

// These modals are in the old folder — they still work fine there
import CreateShiftModal from "../shiftsfolder/CreateShiftModal";
import EditShiftModal from "../shiftsfolder/EditShiftModal";

// ─── Donut chart helper functions ────────────────────────────
// These classify each shift into a category for the donut chart.

// Donut chart color for each category
const DONUT_COLORS = {
  ongoing:   "#059669",
  upcoming:  "#1B3F8B",
  needsStaff: "#f59e0b",
  completed: "#d1d5db",
};

// classifyForDonut - decides which donut category a shift belongs to
// A shift "needs staff" if it is upcoming AND still has open slots
function classifyForDonut(shift) {
  const s = getStatus(shift.shiftStartTime, shift.shiftEndTime);
  const openSlots = shift.slotsAvailable ?? 0;
  if (s === "ongoing")                       return "ongoing";
  if (s === "completed")                     return "completed";
  if (s === "upcoming" && openSlots > 0)     return "needsStaff";
  if (s === "upcoming")                      return "upcoming";
  return "completed";
}

// scaleCounts - scales raw sample counts to match the real total
// This is needed because the dashboard API only returns a sample of shifts
// not all of them, so we scale up proportionally to the real total
function scaleCounts(raw, total) {
  const keys = ["ongoing", "upcoming", "needsStaff", "completed"];
  const sum = keys.reduce((acc, k) => acc + raw[k], 0);
  if (total <= 0 || sum <= 0) return { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
  // Scale each category proportionally
  const scaled = keys.map((k) => Math.round((raw[k] / sum) * total));
  // Fix any rounding errors so the total matches exactly
  const diff = total - scaled.reduce((a, b) => a + b, 0);
  const maxIdx = scaled.indexOf(Math.max(...scaled));
  scaled[maxIdx] += diff;
  return { ongoing: scaled[0], upcoming: scaled[1], needsStaff: scaled[2], completed: scaled[3] };
}

// DonutLegend - the colored legend rows below the donut chart
// Shows a bar and count for each category
function DonutLegend({ rows, total }) {
  const denominator = total > 0 ? total : 1;
  return (
    <ul className="mt-2 w-full space-y-1.5">
      {rows.map((row) => {
        const barPercent = total > 0 ? (row.value / denominator) * 100 : 0;
        return (
          <li key={row.name} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-gray-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="truncate">{row.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-gray-900">{row.value}</span>
            </div>
            <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${barPercent}%`, backgroundColor: row.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const ShiftsPage = () => {

  // ── STATE: Shift list data ──────────────────────────────
  // List of shifts loaded from the server
  const [shifts, setShifts] = useState([]);

  // True while the main shift list is loading (shows skeleton)
  const [loading, setLoading] = useState(true);

  // True if loading the list failed (shows error state)
  const [fetchError, setFetchError] = useState(false);

  // Total number of shifts matching current filter (for "showing X of Y")
  const [totalShifts, setTotalShifts] = useState(0);

  // Total number of pages for pagination
  const [totalPages, setTotalPages] = useState(1);

  // Timestamp of the last successful data load (shown on mobile)
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  // ── STATE: Pagination and filters ──────────────────────
  // Current page number (starts at 1)
  const [currentPage, setCurrentPage] = useState(1);

  // The text currently typed in the search box
  const [searchText, setSearchText] = useState("");

  // The actual search value sent to the API
  // Updated 300ms after the user stops typing (debounced)
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Currently selected status filter tab
  // Can be: "all", "ongoing", "upcoming", "completed"
  const [activeFilter, setActiveFilter] = useState("all");

  // ── STATE: Stat card counts ─────────────────────────────
  // Counts for the 4 stat cards at the top
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    ongoing: 0,
    upcoming: 0,
    completed: 0,
  });

  // ── STATE: Donut chart data ─────────────────────────────
  // Raw data from the dashboard API, used to build the donut chart
  const [dashData, setDashData] = useState(null);

  // ── STATE: Modal / panel visibility ────────────────────
  // The shift that was clicked — when set the side panel opens
  // When null the side panel is hidden
  const [selectedShift, setSelectedShift] = useState(null);

  // True when the create new shift form should show
  const [showCreateForm, setShowCreateForm] = useState(false);

  // The shift being edited — when set the edit form opens
  // When null the edit form is hidden
  const [shiftToEdit, setShiftToEdit] = useState(null);

  // The shift being deleted — when set the delete dialog shows
  // When null the delete dialog is hidden
  const [shiftToDelete, setShiftToDelete] = useState(null);

  // True while the delete API call is running
  const [isDeleting, setIsDeleting] = useState(false);

  // ── STATE: Create form fields ───────────────────────────
  // Holds the values of all fields in the Create Shift form
  const [createFormData, setCreateFormData] = useState({
    shiftTitle: "",
    shiftStartTime: "",
    shiftEndTime: "",
    shiftNotes: "",
    slotsAvailable: "",
  });

  // True while the create shift API call is running
  const [isCreating, setIsCreating] = useState(false);

  // True while the update shift API call is running
  const [isEditing, setIsEditing] = useState(false);

  // ── REF: for silent auto-refresh ───────────────────────
  // We store the latest "load silently" function in a ref
  // so the auto-refresh interval can always call the latest version
  // without needing to be recreated every time state changes
  const silentRefreshRef = useRef(null);

  // ─────────────────────────────────────────────────────────
  // DEBOUNCE: Wait 300ms after user stops typing before searching
  // This prevents an API call on every single keystroke
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Set a timer to update the debounced value after 300ms
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    // If user types again before 300ms, cancel the previous timer
    return () => clearTimeout(timer);
  }, [searchText]);

  // ─────────────────────────────────────────────────────────
  // FUNCTION: loadShifts
  // Fetches the current page of shifts from the server.
  // Uses the current filter and search values.
  // silent = true means don't show the loading spinner (for auto-refresh)
  // ─────────────────────────────────────────────────────────
  async function loadShifts(page, silent = false) {
    try {
      // Show loading spinner unless this is a silent background refresh
      if (!silent) {
        setLoading(true);
        setFetchError(false);
      }

      // Call the API with current page, filter, and search
      const result = await getAllShifts(page, 20, activeFilter, debouncedSearch);

      // Update the shift list and pagination info
      setShifts(result.shifts);
      setTotalPages(result.totalPages);
      setTotalShifts(result.total);
      setLastUpdated(new Date());
    } catch (err) {
      // Only show error state for non-silent loads
      if (!silent) {
        setFetchError(true);
        toast.error(getApiErrorMessage(err, "Failed to load shifts. Please try again."));
      }
      if (import.meta.env.DEV) console.error("Load shifts error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: loadStats
  // Fetches the counts for the 4 stat cards and the donut chart.
  // Called on page load and after any shift is created/edited/deleted.
  // ─────────────────────────────────────────────────────────
  async function loadStats() {
    try {
      // Run both API calls at the same time for speed
      const [counts, dash] = await Promise.all([
        getStatusCounts(),
        getDashboardData(),
      ]);
      setStatusCounts(counts);
      setDashData(dash);
    } catch {
      // Keep the previous stat values if loading fails
    }
  }

  // ─────────────────────────────────────────────────────────
  // EFFECT: Initial page load
  // Load shifts and stats when the page first opens
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadShifts(1);
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────
  // EFFECT: Reload when filter or search changes
  // When user picks a new filter tab or finishes typing a search,
  // reset to page 1 and reload the list
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Reset to page 1 when filter or search changes
    setCurrentPage(1);
    loadShifts(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, debouncedSearch]);

  // ─────────────────────────────────────────────────────────
  // EFFECT: Reload when page number changes
  // Called when user clicks Previous / Next pagination buttons
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadShifts(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ─────────────────────────────────────────────────────────
  // EFFECT: Auto-refresh every 60 seconds
  // Quietly reloads the shift list in the background without
  // showing the loading spinner. The user doesn't see anything.
  // ─────────────────────────────────────────────────────────
  // Always store the latest silent refresh function in the ref
  silentRefreshRef.current = () => loadShifts(currentPage, true);

  useEffect(() => {
    // Set up the interval — fires every 60 seconds
    const interval = setInterval(() => {
      if (silentRefreshRef.current) {
        silentRefreshRef.current();
      }
    }, 60_000);

    // Clean up: stop the interval when the component is removed
    return () => clearInterval(interval);
  }, []); // Empty array: only set up the interval once

  // ─────────────────────────────────────────────────────────
  // EFFECT: ESC key closes any open panel or modal
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    function handleEscKey(e) {
      if (e.key !== "Escape") return;
      // Close whichever panel is open, in priority order
      if (selectedShift)   { setSelectedShift(null);  return; }
      if (showCreateForm)  { setShowCreateForm(false); return; }
      if (shiftToEdit)     { setShiftToEdit(null);     return; }
      if (shiftToDelete)   { setShiftToDelete(null);   return; }
    }
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [selectedShift, showCreateForm, shiftToEdit, shiftToDelete]);

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleViewShift
  // Called when manager clicks a shift row or the eye button.
  // Opens the details side panel for that shift.
  // ─────────────────────────────────────────────────────────
  function handleViewShift(shift) {
    setSelectedShift(shift);
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleCloseDetails
  // Called when manager clicks X on the side panel.
  // Hides the side panel.
  // ─────────────────────────────────────────────────────────
  function handleCloseDetails() {
    setSelectedShift(null);
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleEditShift
  // Called when manager clicks the edit button on a shift.
  // Opens the edit form for that shift.
  // ─────────────────────────────────────────────────────────
  function handleEditShift(shift) {
    setShiftToEdit(shift);
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleDeleteClick
  // Called when manager clicks the delete button on a shift.
  // Opens the delete confirmation dialog.
  // ─────────────────────────────────────────────────────────
  function handleDeleteClick(shift) {
    setShiftToDelete(shift);
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleConfirmDelete
  // Called when manager confirms "Yes, Delete" in the dialog.
  // Actually sends the delete request to the server.
  // ─────────────────────────────────────────────────────────
  async function handleConfirmDelete() {
    // Safety check: should never happen but just in case
    if (!shiftToDelete) return;

    setIsDeleting(true);
    try {
      // Send delete request to server
      await apiDeleteShift(shiftToDelete._id);
      toast.success("Shift deleted");

      // Close the confirmation dialog
      setShiftToDelete(null);

      // Reload the list and stat counts to reflect the deletion
      loadShifts(currentPage);
      loadStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete failed. Please try again."));
    } finally {
      setIsDeleting(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleFilterChange
  // Called when manager clicks a filter tab or a stat card.
  // Changes which shifts are shown.
  // ─────────────────────────────────────────────────────────
  function handleFilterChange(filter) {
    setActiveFilter(filter);
    // Page resets to 1 via the useEffect that watches activeFilter
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleSearchChange
  // Called when manager types in the search box.
  // The actual API call is debounced (delayed 300ms).
  // ─────────────────────────────────────────────────────────
  function handleSearchChange(text) {
    setSearchText(text);
    // debouncedSearch updates 300ms later via useEffect
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handlePageChange
  // Called when manager clicks Previous or Next pagination buttons.
  // ─────────────────────────────────────────────────────────
  function handlePageChange(newPage) {
    setCurrentPage(newPage);
    // Page reload happens via the useEffect that watches currentPage
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleCreateFormChange
  // Called when manager types in any field of the create form.
  // If start time changes and end time is now invalid, clear end time.
  // ─────────────────────────────────────────────────────────
  function handleCreateFormChange(e) {
    const { name, value } = e.target;
    if (name === "shiftStartTime") {
      setCreateFormData((prev) => {
        const updated = { ...prev, shiftStartTime: value };
        // If the new start time is after the existing end time, clear end time
        if (prev.shiftEndTime && new Date(prev.shiftEndTime) <= new Date(value)) {
          updated.shiftEndTime = "";
          toast.info("Please select a new end time");
        }
        return updated;
      });
      return;
    }
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleCreateSubmit
  // Called when manager submits the create shift form.
  // Validates the data then sends it to the server.
  // ─────────────────────────────────────────────────────────
  async function handleCreateSubmit(e) {
    e.preventDefault();

    // Check all required fields are filled
    if (!createFormData.shiftTitle || !createFormData.shiftStartTime ||
        !createFormData.shiftEndTime || !createFormData.slotsAvailable) {
      return toast.error("Please fill all required fields");
    }

    const startTime = new Date(createFormData.shiftStartTime);
    const endTime   = new Date(createFormData.shiftEndTime);

    // Check the dates are valid
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return toast.error("Please select a valid start and end date and time");
    }

    // End time must be after start time
    if (endTime <= startTime) {
      return toast.error("End time must be after start time");
    }

    // Shift cannot be longer than 24 hours
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    if (durationHours > 24) {
      return toast.error("Shift cannot be longer than 24 hours");
    }

    setIsCreating(true);
    try {
      // Send the new shift to the server
      await apiCreateShift(createFormData);
      toast.success("Shift created successfully");

      // Clear the form fields
      setCreateFormData({
        shiftTitle: "",
        shiftStartTime: "",
        shiftEndTime: "",
        shiftNotes: "",
        slotsAvailable: "",
      });

      // Close the create form
      setShowCreateForm(false);

      // Reload both the list and stats to show the new shift
      loadShifts(currentPage);
      loadStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create shift. Please try again."));
    } finally {
      setIsCreating(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleEditFormChange
  // Called when manager changes a field in the edit form.
  // Works the same as create form change handler.
  // ─────────────────────────────────────────────────────────
  function handleEditFormChange(e) {
    const { name, value } = e.target;
    setShiftToEdit((prev) => {
      if (!prev) return prev;
      if (name === "shiftStartTime") {
        const updated = { ...prev, shiftStartTime: value };
        // Clear end time if it's now before the new start time
        if (prev.shiftEndTime && new Date(prev.shiftEndTime) <= new Date(value)) {
          updated.shiftEndTime = "";
          toast.info("Please select a new end time");
        }
        return updated;
      }
      return { ...prev, [name]: value };
    });
  }

  // ─────────────────────────────────────────────────────────
  // FUNCTION: handleEditSubmit
  // Called when manager submits the edit shift form.
  // Validates the data then sends the update to the server.
  // ─────────────────────────────────────────────────────────
  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!shiftToEdit) return;

    const startTime = new Date(shiftToEdit.shiftStartTime);
    const endTime   = new Date(shiftToEdit.shiftEndTime);

    // Validate dates
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return toast.error("Please select a valid start and end date and time");
    }
    if (endTime <= startTime) {
      return toast.error("End time must be after start time");
    }
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    if (durationHours > 24) {
      return toast.error("Shift cannot be longer than 24 hours");
    }

    setIsEditing(true);
    try {
      // Send the updated shift data to the server
      await apiUpdateShift(shiftToEdit._id, shiftToEdit);
      toast.success("Shift updated successfully");

      // Close the edit form
      setShiftToEdit(null);

      // Reload to show the updated shift
      loadShifts(currentPage);
      loadStats();
    } catch {
      toast.error("Failed to update shift. Please try again.");
    } finally {
      setIsEditing(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // COMPUTE: Build donut chart data from dashboard API response
  // The dashData contains a sample of recent shifts.
  // We classify each one and scale up to the real total.
  // ─────────────────────────────────────────────────────────
  let donutChartData = [];
  let donutTotal = 0;

  if (dashData) {
    const totalShiftCount = dashData.stats?.totalShifts ?? 0;
    // Count how many sample shifts fall into each category
    const rawCounts = { ongoing: 0, upcoming: 0, needsStaff: 0, completed: 0 };
    for (const shift of dashData.recentShifts || []) {
      const category = classifyForDonut(shift);
      rawCounts[category] += 1;
    }
    // Scale the sample counts up to the real total
    const scaledCounts = scaleCounts(rawCounts, totalShiftCount);

    // Build the array that DonutChart expects
    donutChartData = [
      { name: "Ongoing",     value: scaledCounts.ongoing,   color: DONUT_COLORS.ongoing },
      { name: "Upcoming",    value: scaledCounts.upcoming,  color: DONUT_COLORS.upcoming },
      { name: "Needs staff", value: scaledCounts.needsStaff, color: DONUT_COLORS.needsStaff },
      { name: "Completed",   value: scaledCounts.completed, color: DONUT_COLORS.completed },
    ];
    donutTotal = totalShiftCount;
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FC] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Page title and Create Shift button ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shifts</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and schedule team shifts</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            {/* Create Shift button — opens the create form modal */}
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 sm:w-auto sm:px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 focus-visible:ring-offset-1"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              + Create Shift
            </button>
          </div>
        </div>

        {/* ── Stat cards at the top of page ── */}
        {/* ShiftStats handles its own skeleton loading state */}
        <ShiftStats
          statusCounts={statusCounts}
          activeFilter={activeFilter}
          onFilterClick={handleFilterChange}
          loading={loading}
        />

        {/* ── Main content: table (left) + donut chart (right) ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">

          {/* ── Left: Shift list card ── */}
          <div className="order-2 overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-sm lg:order-1 lg:col-span-8">

            {/* Search bar and filter tabs */}
            <ShiftFilters
              searchText={searchText}
              onSearchChange={handleSearchChange}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              statusCounts={statusCounts}
            />

            {/* ── Shift list content area ── */}
            {loading ? (
              // Loading skeleton
              <div className="px-4 py-8 sm:px-6">
                {/* Desktop table skeleton */}
                <div className="hidden md:block">
                  <SkeletonTable rows={5} cols={5} />
                </div>
                {/* Mobile list skeleton */}
                <div className="md:hidden">
                  <SkeletonList count={4} />
                </div>
              </div>
            ) : fetchError ? (
              // Error state — shows retry button
              <div className="px-4 py-8 sm:px-6">
                <ErrorState
                  title="Failed to load shifts"
                  description="Could not load shifts. Please try again."
                  onRetry={() => loadShifts(currentPage)}
                />
              </div>
            ) : shifts.length === 0 ? (
              // Empty state — shown when no shifts match the filter/search
              <EmptyState
                icon={CalendarDays}
                title="No shifts found"
                description="Create your first shift to get started."
                actionLabel="Create Shift"
                onAction={() => setShowCreateForm(true)}
              />
            ) : (
              <>
                {/* ── Mobile: card list (shown on small screens only) ── */}
                <div className="space-y-3 px-4 pb-4 md:hidden">
                  {shifts.map((shift) => (
                    <ShiftCard
                      key={shift._id}
                      shift={shift}
                      onView={handleViewShift}
                      onEdit={handleEditShift}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>

                {/* ── Desktop: table (shown on medium screens and above) ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-slate-50/50">
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shift</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fill Rate</th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((shift) => (
                        <ShiftTableRow
                          key={shift._id}
                          shift={shift}
                          onView={handleViewShift}
                          onEdit={handleEditShift}
                          onDelete={handleDeleteClick}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Footer: pagination and count ── */}
            {!loading && !fetchError && shifts.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 space-y-3">
                {/* "Showing X of Y" text */}
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{shifts.length}</span> of{" "}
                  <span className="font-semibold text-gray-600">{totalShifts}</span> shifts · Page{" "}
                  <span className="font-semibold text-gray-600">{currentPage}</span> of{" "}
                  <span className="font-semibold text-gray-600">{totalPages}</span>
                </p>

                {/* Previous / Next pagination buttons */}
                <div className="flex items-center justify-between mt-4 px-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition"
                  >
                    Next →
                  </button>
                </div>

                {/* Last updated time — shown only on mobile */}
                <p className="text-xs text-gray-400 text-center pt-2 md:hidden">
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString("en-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Donut chart sidebar ── */}
          <aside className="order-1 lg:order-2 lg:col-span-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-sm font-semibold text-gray-900">Shift status</h2>
              <p className="mt-0.5 text-xs text-gray-400">Distribution across all shifts</p>
              <div className="mt-4 flex flex-col items-center">
                {/* DonutChart from the shared UI components */}
                <DonutChart
                  data={donutChartData}
                  size={120}
                  centerValue={String(donutTotal)}
                  centerLabel="Total"
                />
                {/* Legend rows below the chart */}
                <DonutLegend rows={donutChartData} total={donutTotal} />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ─── Modals and overlays ─────────────────────────── */}

      {/* Create Shift form modal */}
      <CreateShiftModal
        show={showCreateForm}
        setShow={setShowCreateForm}
        createShift={createFormData}
        onChange={handleCreateFormChange}
        onSubmit={handleCreateSubmit}
        submitting={isCreating}
      />

      {/* Edit Shift form modal — only shown when a shift is being edited */}
      {shiftToEdit && (
        <EditShiftModal
          editingShift={shiftToEdit}
          setEditingShift={setShiftToEdit}
          onEditChange={handleEditFormChange}
          onUpdateHandler={handleEditSubmit}
          submitting={isEditing}
        />
      )}

      {/* Side panel for shift details */}
      {/* Slides in from the right when a shift is clicked */}
      <ShiftDetails
        shift={selectedShift}
        onClose={handleCloseDetails}
        onEdit={(shift) => { setSelectedShift(null); handleEditShift(shift); }}
        onDelete={(shift) => { setSelectedShift(null); handleDeleteClick(shift); }}
      />

      {/* Delete confirmation dialog */}
      {/* Appears when the trash icon is clicked on a shift */}
      <ShiftDeleteConfirm
        shift={shiftToDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShiftToDelete(null)}
      />
    </div>
  );
};

export default ShiftsPage;
