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
  X,
  ChevronLeft,
  ChevronRight,
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
      { name: "Calendar", path: "/manager/calendar", icon: Clock },
      { name: "Attendance", path: "/manager/attendance", icon: FileText },
      { name: "Reports", path: "/manager/reports", icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", path: "/manager/settings", icon: Settings }],
  },
];

const NavItem = ({ item, isActive, onNavigate, effectiveCollapsed }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={effectiveCollapsed ? item.name : undefined}
      onClick={() => onNavigate?.()}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        effectiveCollapsed ? "justify-center" : ""
      } ${
        isActive
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-white"
          aria-hidden
        />
      )}
      <Icon
        className={`h-5 w-5 flex-shrink-0 transition-colors ${
          isActive ? "text-white" : "text-white/50 group-hover:text-white"
        }`}
        strokeWidth={2}
      />
      <span className={`truncate ${effectiveCollapsed ? "hidden" : ""}`}>{item.name}</span>
    </Link>
  );
};

const Managersidebar = ({ onNavigate, effectiveCollapsed, onToggleCollapse }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const firstInitial = user?.username?.trim()?.[0]?.toUpperCase() ?? "M";

  const isItemActive = (path) =>
    pathname === path || (path !== "/manager/dashboard" && pathname.startsWith(`${path}/`));

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="flex h-full min-h-full w-full flex-col bg-[#0f2042]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
        <span className="text-xs font-semibold text-white/80">Menu</span>
        <button
          type="button"
          onClick={() => onNavigate?.()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-white/70 hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className={`shrink-0 border-b border-white/10 px-6 py-5 ${effectiveCollapsed ? "px-2 py-4" : ""}`}
      >
        <div className={`flex items-center gap-3 ${effectiveCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <span className="text-sm font-bold text-white">BW</span>
          </div>
          <div className={`min-w-0 ${effectiveCollapsed ? "hidden" : ""}`}>
            <p className="text-sm font-bold tracking-wide text-white">BWPost</p>
            <p className="text-xs uppercase tracking-widest text-white/40">Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p
              className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30 ${
                effectiveCollapsed ? "hidden" : ""
              }`}
            >
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={isItemActive(item.path)}
                  onNavigate={onNavigate}
                  effectiveCollapsed={effectiveCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex w-full flex-col">
        <div className="hidden shrink-0 border-t border-white/10 px-3 py-2 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-white/60 transition-all duration-150 hover:bg-white/[0.08] hover:text-white"
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveCollapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>

        <div
          className={`shrink-0 border-t border-white/10 px-4 py-4 ${effectiveCollapsed ? "px-2" : ""}`}
        >
        <div className={`flex items-center gap-3 ${effectiveCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
            {firstInitial}
          </div>
          <div className={`min-w-0 flex-1 ${effectiveCollapsed ? "hidden" : ""}`}>
            <p className="truncate text-sm font-medium text-white">{getDisplayName(user, "Manager")}</p>
            <p className="truncate text-xs text-white/40">{user?.email || ""}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white ${
              effectiveCollapsed ? "hidden" : ""
            }`}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        {effectiveCollapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : null}
        </div>
      </div>
    </aside>
  );
};

export default Managersidebar;
