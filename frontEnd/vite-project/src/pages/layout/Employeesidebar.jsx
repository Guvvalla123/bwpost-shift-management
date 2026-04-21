import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogIn,
  Search,
  CalendarCheck,
  FileText,
  User,
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
    items: [{ name: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "My shifts",
    items: [
      { name: "Check In", path: "/employee/checkin", icon: LogIn },
      { name: "Available Shifts", path: "/employee/AllShifts", icon: Search },
      { name: "My Shifts", path: "/employee/myshifts", icon: CalendarCheck },
      { name: "My Requests", path: "/employee/requests", icon: FileText },
    ],
  },
  {
    label: "Account",
    items: [{ name: "Profile", path: "/employee/profile", icon: User }],
  },
];

const NavItem = ({ item, isActive, onNavigate, effectiveCollapsed }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={effectiveCollapsed ? item.name : undefined}
      onClick={() => onNavigate?.()}
      className={`mx-2 flex min-h-[48px] items-center gap-2.5 rounded-lg px-4 py-3 text-sm transition-colors ${
        effectiveCollapsed ? "justify-center lg:justify-center lg:px-2" : ""
      } ${
        isActive
          ? "bg-[#1B3F8B] font-semibold text-white"
          : "text-white/45 hover:bg-white/5 hover:text-white/70"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
          isActive ? "bg-[#60A5FA] text-white" : "bg-white/10 text-white/70"
        }`}
      >
        <Icon className="h-3 w-3" strokeWidth={2} />
      </span>
      <span className={`truncate ${effectiveCollapsed ? "lg:hidden" : ""}`}>{item.name}</span>
    </Link>
  );
};

const EmployeeSidebar = ({ onNavigate, effectiveCollapsed, onToggleCollapse }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "E";

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="flex h-full min-h-full w-full flex-col bg-[#0f2042]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 lg:hidden">
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
        className={`shrink-0 border-b border-white/[0.06] px-4 pb-3 pt-4 ${effectiveCollapsed ? "lg:px-2" : ""}`}
      >
        <div className={`flex items-baseline gap-0.5 ${effectiveCollapsed ? "lg:justify-center" : ""}`}>
          <span className="text-[15px] font-extrabold tracking-tight text-white">BW</span>
          <span className={`text-[15px] font-light tracking-tight text-[#60A5FA] ${effectiveCollapsed ? "lg:hidden" : ""}`}>
            POST
          </span>
        </div>
        <span
          className={`mt-1 inline-block rounded bg-[#60A5FA]/12 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#60A5FA] ${
            effectiveCollapsed ? "lg:hidden" : ""
          }`}
        >
          Employee
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className={`px-4 pb-1 pt-5 text-[8px] font-bold uppercase tracking-widest text-white/20 ${
                effectiveCollapsed ? "lg:hidden" : ""
              }`}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={pathname === item.path || pathname.startsWith(`${item.path}/`)}
                  onNavigate={onNavigate}
                  effectiveCollapsed={effectiveCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex w-full flex-col">
        <div className="hidden shrink-0 border-t border-white/[0.06] px-3 py-2 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-white/45 transition-colors hover:bg-white/5 hover:text-white/70"
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveCollapsed ? <ChevronRight className="h-4 w-4" strokeWidth={2} /> : <ChevronLeft className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>

        <div
          className={`flex shrink-0 items-center gap-2.5 border-t border-white/[0.06] px-3 py-2 ${
            effectiveCollapsed ? "lg:flex-col lg:px-2" : ""
          }`}
        >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#60A5FA] bg-[#1B3F8B] text-xs font-bold text-white">
          {initials}
        </div>
        <div className={`min-w-0 flex-1 ${effectiveCollapsed ? "lg:hidden" : ""}`}>
          <p className="truncate text-[10px] font-medium text-white/80">{getDisplayName(user, "Employee")}</p>
          <p className="text-[9px] capitalize text-white/30">{user?.role || "Employee"}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={`ml-auto rounded-lg p-1.5 text-white/25 transition-colors hover:text-white/60 ${
            effectiveCollapsed ? "lg:hidden" : ""
          }`}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
        {effectiveCollapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            className="hidden w-full items-center justify-center rounded-lg p-2 text-white/40 hover:text-white/70 lg:flex"
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

export default EmployeeSidebar;
