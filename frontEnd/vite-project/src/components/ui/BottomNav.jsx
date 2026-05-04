import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogIn,
  Briefcase,
  User,
  Mail,
  UserCheck,
} from "lucide-react";
import API from "@/api";
import { cn } from "@/lib/utils";

const managerMorePaths = ["/manager/settings", "/manager/calendar", "/manager/attendance", "/manager/reports"];

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await API.get("/api/notifications?page=1&limit=1");
      const c = res.data?.data?.unreadCount;
      if (typeof c === "number") setUnread(c);
      else setUnread(0);
    } catch {
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchUnread();
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchUnread, location.pathname]);

  const managerTabs = [
    { label: "Home", icon: LayoutDashboard, path: "/manager/dashboard" },
    { label: "Shifts", icon: Briefcase, path: "/manager/shifts" },
    { label: "Employees", icon: Users, path: "/manager/employees" },
    { label: "Requests", icon: ClipboardList, path: "/manager/shiftrequests", badge: true },
    { label: "More", icon: Settings, path: "/manager/settings", moreGroup: "manager" },
  ];

  const employeeTabs = [
    { label: "Home", icon: LayoutDashboard, path: "/employee/dashboard" },
    { label: "Check In", icon: LogIn, path: "/employee/checkin" },
    { label: "My Shifts", icon: Briefcase, path: "/employee/myshifts" },
    { label: "Requests", icon: ClipboardList, path: "/employee/requests", badge: true },
    { label: "Profile", icon: User, path: "/employee/profile" },
  ];

  const adminTabs = [
    { label: "Home", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Managers", icon: UserCheck, path: "/admin/managers" },
    { label: "Invites", icon: Mail, path: "/admin/invites" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const getTabs = () => {
    if (!user) return [];
    if (user.role === "manager") return managerTabs;
    if (user.role === "employee") return employeeTabs;
    if (user.role === "admin") return adminTabs;
    return [];
  };

  const tabs = getTabs();
  if (!tabs.length) return null;

  const isPathActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isManagerMoreActive = () =>
    managerMorePaths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around border-t border-gray-200 bg-white md:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
        minHeight: "64px",
      }}
      aria-label="Primary navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.moreGroup
          ? isManagerMoreActive()
          : isPathActive(tab.path);
        const showBadge = tab.badge && unread > 0;
        return (
          <button
            key={tab.path + tab.label}
            type="button"
            onClick={() => navigate(tab.path)}
            className={cn(
              "relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 touch-manipulation transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B3F8B]/30"
            )}
            style={{ color: active ? "#1B3F8B" : "#9CA3AF" }}
          >
            {active && (
              <span
                className="absolute left-2 right-2 top-0 h-0.5 rounded-b-full bg-[#1B3F8B] transition-all duration-150"
                aria-hidden
              />
            )}
            <span className="relative inline-flex">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden />
              {showBadge && (
                <span
                  className="absolute -right-2 -top-1.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5"
                  aria-label={unread > 9 ? "More than 9 unread" : `${unread} unread`}
                >
                  {unread > 9 ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : (
                    <span className="text-[10px] font-bold leading-none text-white">{unread}</span>
                  )}
                </span>
              )}
            </span>
            <span className="mt-0.5 max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
