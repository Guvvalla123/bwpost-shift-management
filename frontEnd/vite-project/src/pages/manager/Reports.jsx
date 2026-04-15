import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
    TrendingUp, Users, CalendarDays, Clock,
    CheckCircle2, XCircle, AlertCircle, Download,
} from "lucide-react";
import API from "@/api";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui";

/* ── Palette ────────────────────────────────────────────────────── */
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

/* ── Stat Card ──────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    </div>
);

/* ── Section Header ─────────────────────────────────────────────── */
const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-5 uppercase tracking-wider">{title}</h3>
        {children}
    </div>
);

/* ── Custom Tooltip ─────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-3 text-sm">
            <p className="font-semibold text-slate-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: <span className="font-bold">{p.value}</span>
                </p>
            ))}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   REPORTS PAGE
══════════════════════════════════════════════════════════════════ */
const Reports = () => {
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [employeeTotal, setEmployeeTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const shiftParams = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end,
                limit: "50",
                page: "1",
            });
            const empParams = new URLSearchParams({ limit: "20", page: "1" });
            const [shiftsRes, empRes] = await Promise.all([
                API.get(`/api/manager/shifts?${shiftParams}`),
                API.get(`/api/manager/shifts/employees?${empParams}`),
            ]);
            setShifts(Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : []);
            const empData = Array.isArray(empRes.data?.data) ? empRes.data.data : [];
            setEmployees(empData);
            setEmployeeTotal(empRes.data?.pagination?.total ?? empData.length);
        } catch {
            setLoadError(true);
            toast.error("Failed to load report data");
            setShifts([]);
            setEmployees([]);
            setEmployeeTotal(0);
        } finally {
            setLoading(false);
        }
    }, [dateRange.start, dateRange.end]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const summaryStats = useMemo(() => {
        const now = Date.now();
        const totalShifts = shifts.length;
        const upcoming = shifts.filter(s => new Date(s.shiftStartTime) > now).length;
        const ongoing = shifts.filter(s => new Date(s.shiftStartTime) <= now && new Date(s.shiftEndTime) >= now).length;
        const completed = shifts.filter(s => new Date(s.shiftEndTime) < now).length;
        const filledSlots = shifts.reduce((a, s) => a + (s.acceptedEmployees?.length || 0), 0);
        const totalCapacity = shifts.reduce((a, s) => a + (s.slotsAvailable || 0) + (s.acceptedEmployees?.length || 0), 0);
        const fillRate = totalCapacity > 0 ? Math.round((filledSlots / totalCapacity) * 100) : 0;
        const totalEmployees = employeeTotal;
        const avgH = shifts.length === 0
            ? 0
            : shifts.reduce((a, s) => a + (new Date(s.shiftEndTime) - new Date(s.shiftStartTime)) / 3600000, 0) / shifts.length;
        const avgShiftDuration = `${Math.round(avgH * 10) / 10}h`;
        const summaryRows = [
            { label: "Total Shifts Created", value: totalShifts, color: "text-[#1B3F8B]" },
            { label: "Upcoming Shifts", value: upcoming, color: "text-blue-600" },
            { label: "Currently Ongoing", value: ongoing, color: "text-emerald-600" },
            { label: "Completed Shifts", value: completed, color: "text-slate-600" },
            { label: "Total Employees", value: totalEmployees, color: "text-purple-600" },
            { label: "Total Capacity", value: totalCapacity, color: "text-amber-600" },
            { label: "Slots Filled", value: filledSlots, color: "text-teal-600" },
            { label: "Overall Fill Rate", value: `${fillRate}%`, color: "text-orange-600" },
            { label: "Avg Shift Duration", value: avgShiftDuration, color: "text-cyan-600" },
        ];
        return {
            totalShifts,
            upcoming,
            ongoing,
            completed,
            filledSlots,
            totalCapacity,
            fillRate,
            totalEmployees,
            avgShiftDuration,
            summaryRows,
        };
    }, [shifts, employees, employeeTotal]);

    const chartData = useMemo(() => {
        const now = Date.now();
        const upcoming = shifts.filter(s => new Date(s.shiftStartTime) > now).length;
        const ongoing = shifts.filter(s => new Date(s.shiftStartTime) <= now && new Date(s.shiftEndTime) >= now).length;
        const completed = shifts.filter(s => new Date(s.shiftEndTime) < now).length;
        const map = {};
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
            map[key] = 0;
            months.push(key);
        }
        shifts.forEach(s => {
            const d = new Date(s.shiftStartTime);
            const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
            if (map[key] !== undefined) map[key]++;
        });
        const monthlyData = months.map(m => ({ month: m, shifts: map[m] }));
        const statusData = [
            { name: "Upcoming", value: upcoming },
            { name: "Ongoing", value: ongoing },
            { name: "Completed", value: completed },
        ].filter(d => d.value > 0);
        const empShiftCount = {};
        shifts.forEach(s => {
            (s.acceptedEmployees || []).forEach(e => {
                const name = e.username || e.email || "Unknown";
                empShiftCount[name] = (empShiftCount[name] || 0) + 1;
            });
        });
        const topEmployees = Object.entries(empShiftCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, shifts: count }));
        return { monthlyData, statusData, topEmployees };
    }, [shifts, employees]);

    const handleExportCsv = useCallback(async () => {
        try {
            setExporting(true);
            const response = await API.get(
                "/api/manager/shifts/export/csv",
                { responseType: "blob" }
            );
            const disposition =
                response.headers["content-disposition"];
            let filename = "report.csv";
            if (disposition) {
                const match = disposition.match(
                    /filename="([^"]+)"/
                );
                if (match) filename = match[1];
            }
            const url = window.URL.createObjectURL(
                new Blob([response.data])
            );
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

    const { monthlyData, statusData, topEmployees } = chartData;

    if (loading) {
        return (
            <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 pb-20 lg:pb-6 max-w-7xl mx-auto space-y-4">
                <SkeletonCard lines={3} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard lines={8} />
                    <SkeletonCard lines={8} />
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 pb-20 lg:pb-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                    <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">Workforce performance overview</p>
                </div>
                <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={exporting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 h-12 text-base font-semibold bg-gradient-to-r from-[#1B3F8B] to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                    <Download size={15} />
                    {exporting ? "Exporting..." : "Export Report"}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                        className="w-full h-12 px-3 rounded-lg border text-base border-slate-200"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                        className="w-full h-12 px-3 rounded-lg border text-base border-slate-200"
                    />
                </div>
            </div>

            {loadError && (
                <div className="text-red-600 p-4 rounded bg-red-50">
                    Failed to load report data. Please try again.
                </div>
            )}

            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={CalendarDays} label="Total Shifts" value={summaryStats.totalShifts} sub="All time" color="bg-gradient-to-br from-[#2563EB] to-blue-600" />
                <StatCard icon={Users} label="Total Employees" value={summaryStats.totalEmployees} sub="Registered staff" color="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <StatCard icon={CheckCircle2} label="Completed" value={summaryStats.completed} sub="Past shifts" color="bg-gradient-to-br from-blue-500 to-cyan-600" />
                <StatCard icon={TrendingUp} label="Fill Rate" value={`${summaryStats.fillRate}%`} sub="Slots filled on avg" color="bg-gradient-to-br from-amber-500 to-orange-500" />
            </div>

            {/* Row: Bar Chart + Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Shifts Bar Chart */}
                <div className="lg:col-span-2 max-w-full overflow-hidden">
                    <Section title="Shifts Per Month (Last 6 Months)">
                        <div className="h-48 sm:h-64 w-full max-w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} barCategoryGap="40%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="shifts" name="Shifts" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    </Section>
                </div>

                {/* Status Pie */}
                <Section title="Shift Status Breakdown">
                    {statusData.length > 0 ? (
                        <div className="h-48 sm:h-64 w-full max-w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-slate-400">
                            <AlertCircle size={32} className="mb-2 opacity-40" />
                            <p className="text-sm">No shift data yet</p>
                        </div>
                    )}
                </Section>
            </div>

            {/* Row: Top Employees + Fill Rate Line */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Employees */}
                <Section title="Top Employees by Shift Count">
                    {topEmployees.length > 0 ? (
                        <div className="space-y-3">
                            {topEmployees.map((emp, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-6 text-xs font-bold text-slate-400 text-right shrink-0">#{i + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {emp.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{emp.name}</p>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-gradient-to-r from-[#2563EB] to-blue-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${(emp.shifts / (topEmployees[0]?.shifts || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 shrink-0">{emp.shifts}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[180px] text-slate-400">
                            <Users size={32} className="mb-2 opacity-40" />
                            <p className="text-sm">No employee shift data yet</p>
                        </div>
                    )}
                </Section>

                {/* Shift Summary Table */}
                <Section title="Recent Shift Summary">
                    <div className="space-y-2">
                        {summaryStats.summaryRows.map((r, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <span className="text-sm text-slate-600">{r.label}</span>
                                <span className={`text-sm font-bold tabular-nums ${r.color}`}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default Reports;
