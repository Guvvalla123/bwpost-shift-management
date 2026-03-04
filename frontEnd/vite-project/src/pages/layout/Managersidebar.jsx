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
import { useAuth } from "@/context/AuthContext";

/* Sharp Cloudinary avatar URL (72×72 face-crop) */
const avatarUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/w_72,h_72,c_fill,g_face,q_auto,f_auto/");
};

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
          ? "bg-indigo-500/20 text-white"
          : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-100"
        }`}
    >
      {/* Active left-edge pill */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full shadow-[0_0_8px_2px_rgba(129,140,248,0.5)]" />
      )}

      {/* Icon box */}
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shrink-0
          ${isActive
            ? "bg-indigo-500/30 text-indigo-300 shadow-sm"
            : "bg-slate-700/50 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
          }`}
      >
        <Icon size={15} />
      </span>

      <span className="flex-1 truncate">{item.name}</span>

      {isActive && (
        <ChevronRight size={13} className="text-indigo-400 shrink-0" />
      )}
    </Link>
  );
};

/* ── Sidebar ─────────────────────────────────────────────────────── */
const Managersidebar = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-slate-900 shadow-2xl border-r border-slate-800/50">

      {/* ── Brand ───────────────────────────────────────────────── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
          <Briefcase size={15} className="text-indigo-400" />
        </div>
        <div className="leading-tight">
          <span className="text-white font-bold text-base tracking-tight">
            BW<span className="text-indigo-400">POST</span>
          </span>
          <p className="text-slate-500 text-[10px] font-medium tracking-widest uppercase">
            Shift Manager
          </p>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest select-none">
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


    </aside>
  );
};


export default Managersidebar;
