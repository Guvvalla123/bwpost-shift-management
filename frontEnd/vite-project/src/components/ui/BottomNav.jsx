import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Settings,
  LogIn,
  Briefcase,
  UserCheck,
  Bell,
  User,
} from "lucide-react";

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const managerTabs = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/manager/dashboard" },
    { label: "Shifts", icon: Briefcase, path: "/manager/shifts" },
    { label: "Employees", icon: Users, path: "/manager/employees" },
    { label: "Calendar", icon: Calendar, path: "/manager/calender" },
    { label: "Reports", icon: ClipboardList, path: "/manager/reports" },
  ];

  const employeeTabs = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/employee/dashboard" },
    { label: "Check In", icon: LogIn, path: "/employee/checkin" },
    { label: "Shifts", icon: Briefcase, path: "/employee/myshifts" },
    { label: "Requests", icon: Bell, path: "/employee/requests" },
    { label: "Profile", icon: User, path: "/employee/profile" },
  ];

  const adminTabs = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Managers", icon: UserCheck, path: "/admin/managers" },
    { label: "Invites", icon: Bell, path: "/admin/invites" },
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

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around lg:hidden safe-bottom"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
        minHeight: "64px",
      }}
      aria-label="Primary navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-center flex-1 py-2 px-1 min-h-[56px] transition-colors duration-150 touch-manipulation"
            style={{ color: active ? "#1B3F8B" : "#9CA3AF" }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden />
            <span className="text-[10px] mt-1 font-medium leading-tight text-center">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
