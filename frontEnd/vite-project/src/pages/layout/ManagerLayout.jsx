import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const SHORT_PAGE_TITLES = {
  "Shift Management": "Shifts",
  "Employee Management": "Employees",
  "Attendance & Timesheets": "Attendance",
  "Shift Requests": "Requests",
  "Reports & Analytics": "Reports",
};
import { LogOut, Settings, User, ChevronDown, Menu, X } from "lucide-react";
import Managersidebar from "./Managersidebar";
import BottomNav from "@/components/ui/BottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/utils/displayName";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

/* Sharp Cloudinary avatar URL (96×96 face-crop) */
const avatarUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/w_96,h_96,c_fill,g_face,q_auto,f_auto/");
};

/* ── Route → Page title map ──────────────────────────────────────── */
const PAGE_TITLES = {
  "/manager/dashboard": "Dashboard",
  "/manager/shifts": "Shift Management",
  "/manager/employees": "Employee Management",
  "/manager/shiftrequests": "Shift Requests",
  "/manager/calender": "Calendar",
  "/manager/attendance": "Attendance & Timesheets",
  "/manager/reports": "Reports & Analytics",
  "/manager/settings": "Settings",
};

/* ══════════════════════════════════════════════════════════════════
   MANAGER LAYOUT
══════════════════════════════════════════════════════════════════ */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const ManagerLayout = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dropdownRef = useRef();
  const { user, logout } = useAuth();
  const { effectiveCollapsed, toggle: toggleSidebarCollapsed } = useSidebarCollapsed();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setProfileOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const pageTitle = PAGE_TITLES[pathname] ?? "Manager Panel";
  const shortTitle = SHORT_PAGE_TITLES[pageTitle] ?? pageTitle;

  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-[#F8F9FC]">

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 flex h-full w-[240px] shrink-0 flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-0
          lg:transition-[width] lg:duration-300
          ${effectiveCollapsed ? "lg:w-16" : "lg:w-[240px]"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Managersidebar
          onNavigate={() => setSidebarOpen(false)}
          effectiveCollapsed={effectiveCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      </div>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="min-w-0 flex flex-1 flex-col overflow-hidden transition-[flex] duration-300">

        {/* ── Top Navbar ──────────────────────────────────────── */}
        <header className="min-h-[56px] lg:min-h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10 safe-top">

          {/* Hamburger + Page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="lg:hidden -ml-2 p-3 rounded-lg text-slate-600 hover:bg-slate-100 transition flex items-center justify-center shrink-0 min-h-[48px] min-w-[48px]"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          <div className="min-w-0">
            <h2 className="font-bold text-[#0f2042] text-xl lg:text-2xl truncate max-w-[160px] sm:max-w-none">
              <span className="sm:hidden">{shortTitle}</span>
              <span className="hidden sm:inline">{pageTitle}</span>
            </h2>
            {pathname === "/manager/dashboard" ? (
              <p className="mt-0.5 hidden truncate text-sm text-gray-400 lg:block">
                {greeting()}, {getDisplayName(user, "Manager")}
              </p>
            ) : (
              <p className="mt-0.5 hidden truncate text-xs text-[#94a3b8] sm:block">
                Manager Panel / {pageTitle}
              </p>
            )}
          </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Notification bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            {/* Profile dropdown */}
            <div className="relative z-40" ref={dropdownRef}>
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
                className="flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#dbeafe] transition focus:outline-none"
              >
                <div className="w-6 h-6 rounded-full bg-[#1B3F8B] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0">
                  {user?.profileImage
                    ? <img src={avatarUrl(user.profileImage)} alt="avatar" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="hidden md:block text-left leading-tight min-w-0">
                  <p className="text-[#1B3F8B] text-xs font-semibold truncate max-w-[120px]">{getDisplayName(user, "Manager")}</p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-[#64748b] transition-transform duration-200 shrink-0 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <div
                  className="
                    absolute right-0 top-full mt-2
                    w-64 max-w-[calc(100vw-2rem)]
                    bg-white rounded-2xl shadow-xl
                    border border-gray-100
                    z-40 overflow-hidden
                    animate-in fade-in zoom-in-95 duration-150
                  "
                >

                  {/* Mini profile header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-[#0f2042]">{getDisplayName(user, "Manager")}</p>
                    <p className="text-xs text-slate-500">{user?.email || ""}</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User size={15} className="text-slate-400" />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => { navigate("/manager/settings"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={15} className="text-slate-400" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 lg:pb-0">
          <Outlet />
        </main>

        <BottomNav />

      </div>
    </div>
  );
};

export default ManagerLayout;
