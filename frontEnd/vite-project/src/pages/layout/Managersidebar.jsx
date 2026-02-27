import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  Clock,
  FileText,
  ChevronRight,
  Briefcase,
} from "lucide-react";

/* ── Nav groups ──────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Workforce",
    items: [
      { name: "Shift Management", path: "/manager/shifts", icon: CalendarDays },
      { name: "Employee Management", path: "/manager/employees", icon: Users },
      { name: "Shift Requests", path: "/manager/shiftrequests", icon: ClipboardList },
    ],
  },
  {
    label: "Tracking",
    items: [
      { name: "Calendar", path: "/manager/calender", icon: Clock },
      { name: "Attendance / Timesheets", path: "/manager/attendance", icon: FileText },
      { name: "Reports / Analytics", path: "/manager/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", path: "/manager/settings", icon: Settings },
    ],
  },
];

/* ── NavItem ─────────────────────────────────────────────────────── */
const NavItem = ({ item, isActive }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive
          ? "bg-white/20 text-white shadow-inner"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
        }`}
    >
      {/* Active left-edge pill — matches auth button gradient */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_8px_2px_rgba(255,255,255,0.4)]" />
      )}

      {/* Icon box */}
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shrink-0
          ${isActive
            ? "bg-white/25 text-white shadow"
            : "bg-white/10 text-blue-200 group-hover:bg-white/20 group-hover:text-white"
          }`}
      >
        <Icon size={15} />
      </span>

      <span className="flex-1 truncate">{item.name}</span>

      {isActive && (
        <ChevronRight size={13} className="text-blue-200 shrink-0" />
      )}
    </Link>
  );
};

/* ── Sidebar ─────────────────────────────────────────────────────── */
const Managersidebar = () => {
  const { pathname } = useLocation();

  return (
    /* Same gradient as login/register main section */
    <aside className="w-64 min-h-screen flex flex-col bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-600 shadow-2xl">

      {/* ── Brand ───────────────────────────────────────────────── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shadow-inner backdrop-blur-sm">
          <Briefcase size={15} className="text-white" />
        </div>
        <div className="leading-tight">
          <span className="text-white font-bold text-base tracking-tight">
            BW<span className="text-blue-200">POST</span>
          </span>
          <p className="text-blue-200/70 text-[10px] font-medium tracking-widest uppercase">
            Shift Manager
          </p>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-blue-200/60 uppercase tracking-widest select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={pathname === item.path}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Manager Profile Card ─────────────────────────────────── */}
      <div className="shrink-0 p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors cursor-default">
          {/* Avatar — matches auth page avatar style */}
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shadow ring-2 ring-white/30 shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">Manager</p>
            <p className="text-blue-200 text-xs truncate">Admin Access</p>
          </div>
          {/* Online dot */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] shrink-0" title="Online" />
        </div>
      </div>

    </aside>
  );
};

export default Managersidebar;
