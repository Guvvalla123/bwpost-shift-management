// ReportsPage.jsx
// Main reports and analytics page for managers.
// Shows KPI cards and charts for shifts and attendance
// within a selected date range.
//
// THIS FILE MANAGES STATE AND DATA.
// UI pieces are in separate component files:
// - DatePresets.jsx      date range filter card with preset buttons
// - ReportStats.jsx      4 KPI stat cards
// - AttendanceChart.jsx  line + bar charts using monthly data
// - ShiftStatusChart.jsx pie chart for shift status breakdown

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  KpiCard, SkeletonKpi, SkeletonChartBlock,
  ErrorState, EmptyState, MobileRefreshButton,
} from "@/components/ui";
import { BarChart2, Download, Loader2 } from "lucide-react";

// Import API functions
import {
  getShiftsReport,
  getAttendanceReport,
  exportReportCSV,
} from "./reportsApi";

// Import sub-components
import DatePresets      from "./DatePresets";
import ReportStats      from "./ReportStats";
import AttendanceChart  from "./AttendanceChart";
import ShiftStatusChart from "./ShiftStatusChart";

// ── Date helpers ───────────────────────────────────────────────
// toYmd - converts a Date object to "YYYY-MM-DD" string
function toYmd(d) {
  return new Date(d).toISOString().split("T")[0];
}

// getDateRange - calculates start and end dates for a quick preset
// preset - "today" | "thisWeek" | "thisMonth" | "lastMonth"
// Returns { start, end } as YYYY-MM-DD strings
function getDateRange(preset) {
  const now    = new Date();
  const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startD   = new Date(endDay);
  let endD     = new Date(endDay);

  if (preset === "today") {
    /* startD and endD already same day */
  } else if (preset === "thisWeek") {
    // Start from Monday of the current week
    const day          = endDay.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    startD             = new Date(endDay);
    startD.setDate(endDay.getDate() + mondayOffset);
  } else if (preset === "thisMonth") {
    startD = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === "lastMonth") {
    startD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endD   = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  return { start: toYmd(startD), end: toYmd(endD) };
}

// ── Main Component ─────────────────────────────────────────────
const ReportsPage = () => {
  // Start date for the report period (YYYY-MM-DD)
  const [startDate, setStartDate] = useState(
    () => toYmd(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  );

  // End date for the report period (YYYY-MM-DD)
  const [endDate, setEndDate] = useState(() => toYmd(new Date()));

  // Draft range: what is shown in the date inputs before Apply is clicked
  const [draftRange, setDraftRange] = useState({
    start: toYmd(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    end:   toYmd(new Date()),
  });

  // Which quick preset is currently active
  // "today" | "thisWeek" | "thisMonth" | "lastMonth" | "custom"
  const [activePreset, setActivePreset] = useState("custom");

  // Shift list loaded from server for the applied date range
  const [shifts, setShifts] = useState([]);

  // Total employee count (from employee list API)
  const [employeeTotal, setEmployeeTotal] = useState(0);

  // Dashboard/attendance summary data from server
  const [dashData, setDashData] = useState(null);

  // True while loading report data
  const [loading, setLoading] = useState(true);

  // True if the last load failed
  const [loadError, setLoadError] = useState(false);

  // True while CSV export is running
  const [exporting, setExporting] = useState(false);

  // True while the mobile refresh button is spinning
  const [mobileRefreshing, setMobileRefreshing] = useState(false);

  // ── Load report data when applied range changes ────────────
  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  // ── Functions ──────────────────────────────────────────────

  // loadReport - fetches both shifts and attendance data in parallel
  async function loadReport() {
    setLoading(true);
    setLoadError(false);
    try {
      const [shiftsResult, dashResult] = await Promise.all([
        getShiftsReport(startDate, endDate),
        getAttendanceReport(),
      ]);
      setShifts(shiftsResult.shifts);
      setEmployeeTotal(shiftsResult.employeeTotal);
      setDashData(dashResult);
    } catch {
      setLoadError(true);
      toast.error("Failed to load report data. Please try again.");
      setShifts([]);
      setEmployeeTotal(0);
      setDashData(null);
    } finally {
      setLoading(false);
    }
  }

  // handlePresetClick - applies a quick date preset and immediately fetches
  // preset - the preset key that was clicked
  function handlePresetClick(preset) {
    setActivePreset(preset);
    const range = getDateRange(preset);
    setDraftRange(range);
    setStartDate(range.start);
    setEndDate(range.end);
  }

  // handleApply - applies the draft range and triggers a fetch
  function handleApply() {
    setActivePreset("custom");
    setStartDate(draftRange.start);
    setEndDate(draftRange.end);
  }

  // handleExportCSV - downloads the report as a CSV file
  async function handleExportCSV() {
    setExporting(true);
    try {
      await exportReportCSV();
      toast.success("Report exported successfully");
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  }

  // handleMobileRefresh - re-fetches data for the mobile refresh button
  async function handleMobileRefresh() {
    setMobileRefreshing(true);
    await loadReport();
    setMobileRefreshing(false);
  }

  // ── Computed values from shift data ───────────────────────

  // summaryStats - KPI numbers computed from the loaded shifts array
  const summaryStats = useMemo(() => {
    const now           = Date.now();
    const totalShifts   = shifts.length;
    const uniqueEmp     = new Set();

    shifts.forEach((s) => {
      (s.acceptedEmployees || []).forEach((e) => {
        const id = e._id || e;
        if (id) uniqueEmp.add(String(id));
      });
    });

    const understaffed   = shifts.filter((s) => (s.slotsAvailable || 0) > 0).length;
    const attendanceRate = dashData?.attendance?.rate ?? 0;

    return {
      totalShifts,
      totalEmployees:    employeeTotal,
      employeesInvolved: uniqueEmp.size,
      understaffed,
      attendanceRate,
    };
  }, [shifts, employeeTotal, dashData]);

  // chartData - monthly bucket arrays for the charts
  const chartData = useMemo(() => {
    const now      = Date.now();
    const upcoming = shifts.filter((s) => new Date(s.shiftStartTime) > now).length;
    const ongoing  = shifts.filter((s) => new Date(s.shiftStartTime) <= now && new Date(s.shiftEndTime) >= now).length;
    const completed = shifts.filter((s) => new Date(s.shiftEndTime) < now).length;

    // Build a rolling 6-month bucket map
    const map    = {};
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      map[key]  = { shifts: 0, completed: 0 };
      months.push(key);
    }
    shifts.forEach((s) => {
      const d   = new Date(s.shiftStartTime);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      if (map[key]) {
        map[key].shifts++;
        if (new Date(s.shiftEndTime) < now) map[key].completed++;
      }
    });

    // Monthly data for line and bar charts
    const monthlyData = months.map((m) => {
      const bucket = map[m];
      const rate   = bucket.shifts > 0
        ? Math.round((bucket.completed / bucket.shifts) * 100)
        : 0;
      return { month: m, shifts: bucket.shifts, rate };
    });

    // Status slices for pie chart (filter out zeros)
    const statusData = [
      { name: "Upcoming",  value: upcoming },
      { name: "Ongoing",   value: ongoing },
      { name: "Completed", value: completed },
    ].filter((d) => d.value > 0);

    return { monthlyData, statusData };
  }, [shifts]);

  // ── Loading skeleton ───────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-20 pt-4 md:px-6 md:py-6 lg:px-8 lg:pb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonKpi key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonChartBlock />
          <SkeletonChartBlock />
        </div>
        <SkeletonChartBlock />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-full bg-[#F8F9FC] px-4 py-8 md:px-6 lg:px-8">
        <ErrorState
          title="Failed to load report data"
          description="Could not load report data. Please try again."
          onRetry={loadReport}
        />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-[#F8F9FC] px-4 pb-28 pt-4 sm:px-6 md:pb-8 lg:px-8">
      {/* ── Page header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Analytics and performance data</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          {/* Mobile refresh button */}
          <MobileRefreshButton onRefresh={handleMobileRefresh} loading={mobileRefreshing} />
          {/* Desktop export button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="hidden h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#162d5e] active:scale-95 disabled:opacity-60 sm:inline-flex sm:w-auto"
          >
            {exporting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Download size={16} />}
            {exporting ? "Exporting" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* ── Date range filter card ── */}
      <DatePresets
        draftRange={draftRange}
        activePreset={activePreset}
        onPresetClick={handlePresetClick}
        onDraftChange={setDraftRange}
        onApply={handleApply}
      />

      {/* ── Empty state: no shifts in selected range ── */}
      {shifts.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No data for selected period"
          description="Try selecting a different date range or check back when shifts are scheduled."
          actionLabel="Apply current range"
          onAction={handleApply}
        />
      ) : (
        <>
          {/* ── KPI stat cards ── */}
          <ReportStats
            totalShifts={summaryStats.totalShifts}
            attendanceRate={summaryStats.attendanceRate}
            employeesInvolved={summaryStats.employeesInvolved}
            understaffed={summaryStats.understaffed}
          />

          {/* ── Charts row: line chart + pie chart side by side ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AttendanceChart
              monthlyData={chartData.monthlyData}
              loading={false}
            />
            <ShiftStatusChart
              statusData={chartData.statusData}
              loading={false}
            />
          </div>
        </>
      )}

      {/* ── Desktop export panel ── */}
      <div className="hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-5 sm:block sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900">Export data</h3>
        <p className="mt-1 text-sm text-gray-600">
          Download a CSV export of shift and roster data from the server. The file reflects
          current backend export rules (same dataset as the manager export action).
        </p>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="mt-4 inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#1B3F8B] bg-white px-5 text-sm font-semibold text-[#1B3F8B] hover:bg-[#EFF6FF] disabled:opacity-60"
        >
          {exporting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Download size={16} />}
          {exporting ? "Preparing" : "Download CSV"}
        </button>
      </div>

      {/* ── Mobile sticky export button at bottom of screen ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#162d5e] active:scale-95 disabled:opacity-60"
        >
          {exporting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Download size={16} />}
          {exporting ? "Exporting" : "Export CSV"}
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
