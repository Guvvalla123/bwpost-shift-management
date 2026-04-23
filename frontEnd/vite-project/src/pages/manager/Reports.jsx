import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Users, CalendarDays,
  Download,
  AlertTriangle,
  BarChart2,
  Loader2,
} from "lucide-react";
import API from "@/api";
import { toast } from "sonner";
import {
  KpiCard,
  SkeletonKpi,
  SkeletonChartBlock,
  ErrorState,
  EmptyState,
  MobileRefreshButton,
} from "@/components/ui";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const Reports = () => {
  const [shifts, setShifts] = useState([]);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mobileRefreshing, setMobileRefreshing] = useState(false);
  const [activePreset, setActivePreset] = useState("custom");
  const [draftRange, setDraftRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [appliedRange, setAppliedRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const shiftParams = new URLSearchParams({
        startDate: appliedRange.start,
        endDate: appliedRange.end,
        limit: "50",
        page: "1",
      });
      const empParams = new URLSearchParams({ limit: "20", page: "1" });
      const [shiftsRes, empRes, dashRes] = await Promise.all([
        API.get(`/api/manager/shifts?${shiftParams}`),
        API.get(`/api/manager/shifts/employees?${empParams}`),
        API.get("/api/manager/shifts/dashboard/data"),
      ]);
      setShifts(Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : []);
      setEmployeeTotal(empRes.data?.pagination?.total ?? 0);
      setDashData(dashRes.data?.data ?? dashRes.data);
    } catch {
      setLoadError(true);
      toast.error("Failed to load report data. Please try again.");
      setShifts([]);
      setEmployeeTotal(0);
      setDashData(null);
    } finally {
      setLoading(false);
    }
  }, [appliedRange.start, appliedRange.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toYmd = (d) => {
    const x = new Date(d);
    return x.toISOString().split("T")[0];
  };

  const applyDatePreset = useCallback((key) => {
    setActivePreset(key);
    const now = new Date();
    const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startD = new Date(endDay);
    let endD = new Date(endDay);
    if (key === "today") {
      /* startD and endD already same day */
    } else if (key === "thisWeek") {
      const day = endDay.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      startD = new Date(endDay);
      startD.setDate(endDay.getDate() + mondayOffset);
    } else if (key === "thisMonth") {
      startD = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (key === "lastMonth") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      startD = first;
      endD = last;
    }
    const next = { start: toYmd(startD), end: toYmd(endD) };
    setDraftRange(next);
    setAppliedRange(next);
  }, []);

  const handleMobileRefresh = useCallback(async () => {
    setMobileRefreshing(true);
    setLoading(true);
    setLoadError(false);
    try {
      const shiftParams = new URLSearchParams({
        startDate: appliedRange.start,
        endDate: appliedRange.end,
        limit: "50",
        page: "1",
      });
      const empParams = new URLSearchParams({ limit: "20", page: "1" });
      const [shiftsRes, empRes, dashRes] = await Promise.all([
        API.get(`/api/manager/shifts?${shiftParams}`),
        API.get(`/api/manager/shifts/employees?${empParams}`),
        API.get("/api/manager/shifts/dashboard/data"),
      ]);
      setShifts(Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : []);
      setEmployeeTotal(empRes.data?.pagination?.total ?? 0);
      setDashData(dashRes.data?.data ?? dashRes.data);
    } catch {
      setLoadError(true);
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
      setMobileRefreshing(false);
    }
  }, [appliedRange.start, appliedRange.end]);

  const summaryStats = useMemo(() => {
    const now = Date.now();
    const totalShifts = shifts.length;
    const upcoming = shifts.filter((s) => new Date(s.shiftStartTime) > now).length;
    const ongoing = shifts.filter((s) => new Date(s.shiftStartTime) <= now && new Date(s.shiftEndTime) >= now).length;
    const completed = shifts.filter((s) => new Date(s.shiftEndTime) < now).length;
    const uniqueEmp = new Set();
    shifts.forEach((s) => {
      (s.acceptedEmployees || []).forEach((e) => {
        const id = e._id || e;
        if (id) uniqueEmp.add(String(id));
      });
    });
    const understaffed = shifts.filter((s) => (s.slotsAvailable || 0) > 0).length;
    const attendanceRate = dashData?.attendance?.rate ?? 0;
    return {
      totalShifts,
      upcoming,
      ongoing,
      completed,
      totalEmployees: employeeTotal,
      employeesInvolved: uniqueEmp.size,
      understaffed,
      attendanceRate,
    };
  }, [shifts, employeeTotal, dashData]);

  const chartData = useMemo(() => {
    const now = Date.now();
    const upcoming = shifts.filter((s) => new Date(s.shiftStartTime) > now).length;
    const ongoing = shifts.filter((s) => new Date(s.shiftStartTime) <= now && new Date(s.shiftEndTime) >= now).length;
    const completed = shifts.filter((s) => new Date(s.shiftEndTime) < now).length;
    const map = {};
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      map[key] = { shifts: 0, completed: 0 };
      months.push(key);
    }
    shifts.forEach((s) => {
      const d = new Date(s.shiftStartTime);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      if (map[key]) {
        map[key].shifts++;
        if (new Date(s.shiftEndTime) < now) map[key].completed++;
      }
    });
    const monthlyData = months.map((m) => {
      const bucket = map[m];
      const rate = bucket.shifts > 0 ? Math.round((bucket.completed / bucket.shifts) * 100) : 0;
      return { month: m, shifts: bucket.shifts, rate };
    });
    const statusData = [
      { name: "Upcoming", value: upcoming },
      { name: "Ongoing", value: ongoing },
      { name: "Completed", value: completed },
    ].filter((d) => d.value > 0);
    return { monthlyData, statusData };
  }, [shifts]);

  const handleExportCsv = useCallback(async () => {
    try {
      setExporting(true);
      const response = await API.get("/api/manager/shifts/export/csv", { responseType: "blob" });
      const disposition = response.headers["content-disposition"];
      let filename = "report.csv";
      if (disposition) {
        const match = disposition.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (err) {
      toast.error("Failed to export report");
      console.error("CSV export error:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  const { monthlyData, statusData } = chartData;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-20 pt-4 md:px-6 md:py-6 lg:px-8 lg:pb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonChartBlock />
          <SkeletonChartBlock />
        </div>
        <SkeletonChartBlock />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-full bg-[#F8F9FC] px-4 py-8 md:px-6 lg:px-8">
        <ErrorState
          title="Failed to load report data"
          description="Could not load report data. Please try again."
          onRetry={fetchData}
        />
      </div>
    );
  }

  const presetBtn = (key, label) => (
    <button
      key={key}
      type="button"
      onClick={() => applyDatePreset(key)}
      className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30 ${
        activePreset === key ? "bg-[#1B3F8B] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-[#F8F9FC] px-4 pb-28 pt-4 sm:px-6 md:pb-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Analytics and performance data</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <MobileRefreshButton onRefresh={handleMobileRefresh} loading={mobileRefreshing} />
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="hidden h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#162d5e] active:scale-95 disabled:pointer-events-none disabled:opacity-60 sm:inline-flex sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Download size={16} strokeWidth={2} />
            )}
            {exporting ? "Exporting" : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-gray-800">Date range</p>
        <p className="text-xs text-gray-400">Filter metrics to shifts starting in this period</p>
        <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1 md:mx-0">
          {presetBtn("today", "Today")}
          {presetBtn("thisWeek", "This Week")}
          {presetBtn("thisMonth", "This Month")}
          {presetBtn("lastMonth", "Last Month")}
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="rep-from">
                From
              </label>
              <input
                id="rep-from"
                type="date"
                value={draftRange.start}
                onChange={(e) => {
                  setActivePreset("custom");
                  setDraftRange((p) => ({ ...p, start: e.target.value }));
                }}
                className="h-12 w-full rounded-xl border border-gray-200 px-3 text-base text-gray-900 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 md:text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="rep-to">
                To
              </label>
              <input
                id="rep-to"
                type="date"
                value={draftRange.end}
                onChange={(e) => {
                  setActivePreset("custom");
                  setDraftRange((p) => ({ ...p, end: e.target.value }));
                }}
                className="h-12 w-full rounded-xl border border-gray-200 px-3 text-base text-gray-900 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/30 md:text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePreset("custom");
              setAppliedRange({ ...draftRange });
            }}
            className="h-12 min-h-[44px] w-full shrink-0 rounded-xl bg-[#1B3F8B] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#162d5e] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
          >
            Apply filter
          </button>
        </div>
      </div>

      {shifts.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No data for selected period"
          description="Try selecting a different date range or check back when shifts are scheduled."
          actionLabel="Apply current range"
          onAction={() => setAppliedRange({ ...draftRange })}
        />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard variant="navy" icon={CalendarDays} label="Total shifts (period)" value={summaryStats.totalShifts} />
        <KpiCard variant="default" icon={TrendingUp} label="Avg. attendance rate" value={`${summaryStats.attendanceRate}%`} />
        <KpiCard variant="green" icon={Users} label="Employees involved" value={summaryStats.employeesInvolved} />
        <KpiCard variant="amber" icon={AlertTriangle} label="Shifts needing staff" value={summaryStats.understaffed} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900">Attendance rate over time</h3>
          <p className="text-xs text-gray-400">Completion ratio by month (last 6 months)</p>
          <div className="mt-4 min-h-[280px] w-full">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" name="Rate" stroke="#1B3F8B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900">Shift status breakdown</h3>
          <p className="text-xs text-gray-400">Current snapshot from filtered shifts</p>
          <div className="mt-4 w-full">
            {statusData.length > 0 ? (
              <div className="flex min-h-[280px] w-full flex-col">
                <div className="h-[200px] w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, width: "100%", paddingTop: 12 }}
                  formatter={(value) => <span className="text-gray-600">{value}</span>}
                  payload={statusData.map((d, i) => ({
                    value: d.name,
                    type: "circle",
                    id: d.name,
                    color: COLORS[i % COLORS.length],
                  }))}
                />
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-gray-400">
                <p className="text-sm">No shift status data in this range</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900">Shifts per month</h3>
        <p className="text-xs text-gray-400">Volume in the rolling six-month window</p>
        <div className="mt-4 min-h-[280px] w-full">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="shifts" name="Shifts" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
        </>
      )}

      <div className="hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-5 sm:block sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900">Export data</h3>
        <p className="mt-1 text-sm text-gray-600">
          Download a CSV export of shift and roster data from the server. The file reflects current backend export rules
          (same dataset as the manager export action).
        </p>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting}
          className="mt-4 inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#1B3F8B] bg-white px-5 text-sm font-semibold text-[#1B3F8B] hover:bg-[#EFF6FF] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Download size={16} />
          )}
          {exporting ? "Preparing" : "Download CSV"}
        </button>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur-sm md:hidden safe-bottom"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting}
          className="inline-flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3F8B] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#162d5e] active:scale-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Download size={16} />
          )}
          {exporting ? "Exporting" : "Export CSV"}
        </button>
      </div>
    </div>
  );
};

export default Reports;
