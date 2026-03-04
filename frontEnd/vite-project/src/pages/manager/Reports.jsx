import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
    TrendingUp, Users, CalendarDays, Clock,
    CheckCircle2, XCircle, AlertCircle, Download,
} from "lucide-react";
import API from "@/api";

/* ── Palette ────────────────────────────────────────────────────── */
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

/* ── Stat Card ──────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shiftsRes, empRes] = await Promise.all([
                    API.get("/api/manager/shifts?limit=200"),
                    API.get("/api/manager/shifts/employees"),
                ]);
                setShifts(Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : []);
                setEmployees(Array.isArray(empRes.data?.data) ? empRes.data.data : []);
            } catch (err) {
                console.error("Reports fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    /* ── Derived Analytics ── */
    const now = Date.now();
    const upcoming = shifts.filter(s => new Date(s.shiftStartTime) > now).length;
    const ongoing = shifts.filter(s => new Date(s.shiftStartTime) <= now && new Date(s.shiftEndTime) >= now).length;
    const completed = shifts.filter(s => new Date(s.shiftEndTime) < now).length;

    const totalSlots = shifts.reduce((a, s) => a + (s.slotsAvailable || 0), 0);
    const filledSlots = shifts.reduce((a, s) => a + (s.acceptedEmployees?.length || 0), 0);
    const fillRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

    /* Shifts per month (last 6 months) */
    const monthlyData = (() => {
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
        return months.map(m => ({ month: m, shifts: map[m] }));
    })();

    /* Status breakdown for Pie */
    const statusData = [
        { name: "Upcoming", value: upcoming },
        { name: "Ongoing", value: ongoing },
        { name: "Completed", value: completed },
    ].filter(d => d.value > 0);

    /* Top 5 employees by shift count */
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

    /* Slots fill rate over time */
    const fillData = monthlyData.map((m, i) => ({
        ...m,
        fillRate: Math.min(100, Math.round(Math.random() * 40 + 50 + i * 3)), // placeholder until real data
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Workforce performance overview</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                    <Download size={15} />
                    Export Report
                </button>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={CalendarDays} label="Total Shifts" value={shifts.length} sub="All time" color="bg-gradient-to-br from-indigo-500 to-blue-600" />
                <StatCard icon={Users} label="Total Employees" value={employees.length} sub="Registered staff" color="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <StatCard icon={CheckCircle2} label="Completed" value={completed} sub="Past shifts" color="bg-gradient-to-br from-blue-500 to-cyan-600" />
                <StatCard icon={TrendingUp} label="Fill Rate" value={`${fillRate}%`} sub="Slots filled on avg" color="bg-gradient-to-br from-amber-500 to-orange-500" />
            </div>

            {/* Row: Bar Chart + Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Shifts Bar Chart */}
                <div className="lg:col-span-2">
                    <Section title="Shifts Per Month (Last 6 Months)">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={monthlyData} barCategoryGap="40%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="shifts" name="Shifts" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Section>
                </div>

                {/* Status Pie */}
                <Section title="Shift Status Breakdown">
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
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
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {emp.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{emp.name}</p>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
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
                        {[
                            { label: "Total Shifts Created", value: shifts.length, color: "text-indigo-600" },
                            { label: "Upcoming Shifts", value: upcoming, color: "text-blue-600" },
                            { label: "Currently Ongoing", value: ongoing, color: "text-emerald-600" },
                            { label: "Completed Shifts", value: completed, color: "text-slate-600" },
                            { label: "Total Employees", value: employees.length, color: "text-purple-600" },
                            { label: "Total Slots Available", value: totalSlots, color: "text-amber-600" },
                            { label: "Slots Filled", value: filledSlots, color: "text-teal-600" },
                            { label: "Overall Fill Rate", value: `${fillRate}%`, color: "text-orange-600" },
                        ].map((r, i) => (
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
