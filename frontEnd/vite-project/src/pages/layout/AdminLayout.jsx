import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LogOut,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Users2,
  UserCheck,
  Users,
  Mail,
  Clock,
  FileText,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/utils/displayName";
import BottomNav from "@/components/ui/BottomNav";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

const avatarUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/w_96,h_96,c_fill,g_face,q_auto,f_auto/");
};

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "User Management",
  "/admin/managers": "Manager Management",
  "/admin/invites": "Invites",
  "/admin/employees": "Employee Management",
  "/admin/calendar": "Calendar",
  "/admin/attendance": "Attendance & Timesheets",
  "/admin/reports": "Reports & Analytics",
  "/admin/settings": "Settings",
};

const SHORT_PAGE_TITLES = {
  "User Management": "Users",
  "Manager Management": "Managers",
  "Employee Management": "Employees",
  "Attendance & Timesheets": "Attendance",
  "Reports & Analytics": "Reports",
};

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { name: "Users", path: "/admin/users", icon: Users2 },
      { name: "Managers", path: "/admin/managers", icon: UserCheck },
      { name: "Employees", path: "/admin/employees", icon: Users },
      { name: "Invites", path: "/admin/invites", icon: Mail },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Calendar", path: "/admin/calendar", icon: Clock },
      { name: "Attendance", path: "/admin/attendance", icon: FileText },
      { name: "Reports", path: "/admin/reports", icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", path: "/admin/settings", icon: Settings }],
  },
];

const AdminNavItem = ({ item, isActive, onNavigate, effectiveCollapsed }) => {
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

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { effectiveCollapsed, toggle: toggleSidebarCollapsed } = useSidebarCollapsed();

  useEffect(() => setSidebarOpen(false), [pathname]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setProfileOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const pageTitle = PAGE_TITLES[pathname] ?? "Admin Panel";
  const shortPageTitle = SHORT_PAGE_TITLES[pageTitle] ?? pageTitle;

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-[#f1f5f9]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-0
          lg:transition-[width] lg:duration-300
          ${effectiveCollapsed ? "lg:w-16" : "lg:w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <aside className="flex h-full min-h-full w-full flex-col bg-[#0f2042]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 lg:hidden">
            <span className="text-xs font-semibold text-white/80">Menu</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
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
              Admin
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
                    <AdminNavItem
                      key={item.path}
                      item={item}
                      isActive={pathname === item.path || pathname.startsWith(`${item.path}/`)}
                      onNavigate={() => setSidebarOpen(false)}
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
                onClick={toggleSidebarCollapsed}
                className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-white/45 transition-colors hover:bg-white/5 hover:text-white/70"
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
              className={`flex shrink-0 items-center gap-2.5 border-t border-white/[0.06] px-3 py-2 ${
                effectiveCollapsed ? "lg:flex-col lg:px-2" : ""
              }`}
            >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#60A5FA] bg-[#1B3F8B] text-xs font-bold text-white">
              {user?.profileImage ? (
                <img src={avatarUrl(user.profileImage)} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className={`min-w-0 flex-1 ${effectiveCollapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-[10px] font-medium text-white/80">{getDisplayName(user, "Admin")}</p>
              <p className="text-[9px] capitalize text-white/30">{user?.role}</p>
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
      </div>

      <div className="min-w-0 flex flex-1 flex-col overflow-hidden transition-[flex] duration-300">
        <header className="min-h-[56px] lg:min-h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 safe-top">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="lg:hidden -ml-2 p-3 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="min-w-0">
              <h2 className="font-bold text-[#0f2042] text-xl lg:text-2xl truncate max-w-[160px] sm:max-w-none">
                <span className="sm:hidden">{shortPageTitle}</span>
                <span className="hidden sm:inline">{pageTitle}</span>
              </h2>
              <p className="text-[#94a3b8] text-xs mt-0.5 hidden sm:block truncate">Admin Panel / {pageTitle}</p>
            </div>
          </div>

          <div className="relative z-40 shrink-0" ref={dropdownRef}>
            {profileOpen && (
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
                aria-hidden
              />
            )}
            <button
              type="button"
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3 py-2 min-h-[44px] cursor-pointer hover:bg-[#dbeafe] transition"
            >
              <div className="w-6 h-6 rounded-full bg-[#1B3F8B] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0">
                {user?.profileImage ? (
                  <img src={avatarUrl(user.profileImage)} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="text-[#1B3F8B] text-xs font-semibold hidden sm:inline max-w-[120px] truncate">
                {getDisplayName(user, "Admin")}
              </span>
            </button>
            {profileOpen && (
              <div
                className="
                  absolute right-0 top-full mt-2
                  w-64 max-w-[calc(100vw-2rem)]
                  bg-white rounded-2xl shadow-xl
                  border border-gray-100
                  z-40 overflow-hidden py-2
                "
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-[#0f2042]">{getDisplayName(user, "Admin")}</p>
                  <p className="text-xs text-slate-500">{user?.email || ""}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigate("/admin/settings");
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={15} className="text-slate-400" /> Settings
                </button>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 lg:pb-0">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

export default AdminLayout;
