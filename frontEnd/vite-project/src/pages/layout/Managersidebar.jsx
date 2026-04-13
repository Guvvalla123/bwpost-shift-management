import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  BarChart2,
  Settings,
  Clock,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/utils/displayName";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workforce",
    items: [
      { name: "Shifts", path: "/manager/shifts", icon: CalendarDays },
      { name: "Employees", path: "/manager/employees", icon: Users },
      { name: "Requests", path: "/manager/shiftrequests", icon: ClipboardList },
    ],
  },
  {
    label: "Tracking",
    items: [
      { name: "Calendar", path: "/manager/calender", icon: Clock },
      { name: "Attendance", path: "/manager/attendance", icon: FileText },
      { name: "Reports", path: "/manager/reports", icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", path: "/manager/settings", icon: Settings }],
  },
];

const NavItem = ({ item, isActive, onNavigate }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={() => onNavigate?.()}
      className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg text-[11px] transition-colors ${
        isActive
          ? "bg-[#1B3F8B] text-white font-semibold"
          : "text-white/45 hover:bg-white/5 hover:text-white/70"
      }`}
    >
      <span
        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
          isActive ? "bg-[#60A5FA] text-white" : "bg-white/10 text-white/70"
        }`}
      >
        <Icon className="w-3 h-3" strokeWidth={2} />
      </span>
      <span className="truncate">{item.name}</span>
    </Link>
  );
};

const Managersidebar = ({ onNavigate }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "M";

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 min-h-full flex flex-col bg-[#0f2042] h-full">
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-baseline gap-0.5">
          <span className="font-extrabold text-white text-[15px] tracking-tight">BW</span>
          <span className="font-light text-[#60A5FA] text-[15px] tracking-tight">POST</span>
        </div>
        <span className="inline-block mt-1 text-[8px] font-bold tracking-widest uppercase text-[#60A5FA] bg-[#60A5FA]/12 px-2 py-0.5 rounded">
          Manager
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[8px] font-bold tracking-widest uppercase text-white/20 px-4 pt-5 pb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={pathname === item.path || pathname.startsWith(item.path + "/")}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-white/[0.06] px-3 py-2 flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1B3F8B] border-2 border-[#60A5FA] flex items-center justify-center text-white font-bold text-xs shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white/80 text-[10px] font-medium truncate">{getDisplayName(user, "Manager")}</p>
          <p className="text-white/30 text-[9px] capitalize">{user?.role || "Manager"}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="ml-auto p-1.5 text-white/25 hover:text-white/60 transition-colors rounded-lg"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default Managersidebar;
