// EmployeeLayout.jsx
// This is the main layout wrapper for all employee pages.
// Every employee page is wrapped in this layout.
//
// WHAT THIS FILE PROVIDES:
// 1. Sidebar navigation (desktop)
// 2. Top header bar with notification bell
// 3. Hamburger menu on mobile
// 4. Bottom navigation on mobile
//    Check In My Shifts Requests Profile tabs
// 5. Page content area (React Router Outlet)
//
// DIFFERENCE FROM MANAGER LAYOUT:
// Employee sees different navigation items
// Employee cannot access manager pages
// The role check in ProtectedRoute handles this

import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut, User, ChevronDown, ClipboardList, Menu, X, Briefcase } from "lucide-react";
import EmployeeSidebar from "./Employeesidebar";
import BottomNav from "@/components/ui/BottomNav";
import NotificationBell from "@/components/layout/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/utils/displayName";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

/* avatarUrl helper — CDN transform identical to Manager layout avatar chips */
const avatarUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/w_96,h_96,c_fill,g_face,q_auto,f_auto/");
};

/* ── Page titles ─────────────────────────────────────────── */
const PAGE_TITLES = {
  "/employee/dashboard": "Dashboard",
  "/employee/checkin": "Check In",
  "/employee/AllShifts": "Available Shifts",
  "/employee/myshifts": "My Shifts",
  "/employee/requests": "My Requests",
  "/employee/profile": "My Profile",
};

const SHORT_PAGE_TITLES_BY_PATH = {
  "/employee/dashboard": "Home",
  "/employee/checkin": "Check In",
  "/employee/AllShifts": "Shifts",
  "/employee/myshifts": "Shifts",
  "/employee/requests": "Requests",
  "/employee/profile": "Profile",
};

/* ══════════════════════════════════════════════════════════
   EMPLOYEE LAYOUT
══════════════════════════════════════════════════════════ */
const EmployeeLayout = () => {
  // Profile dropdown visibility in header
  const [profileOpen, setProfileOpen] = useState(false);

  // Mobile sidebar drawer visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Wrapper ref for dropdown (click-away / layering)
  const dropdownRef = useRef();

  const { user, logout } = useAuth();

  const { effectiveCollapsed, toggle: toggleSidebarCollapsed, isMobile, isDesktop } = useSidebarCollapsed();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setProfileOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // Full headline for breadcrumbs on larger breakpoints
  const pageTitle = PAGE_TITLES[pathname] ?? "Employee Portal";

  // Short headline for phone header bar
  const shortPageTitle = SHORT_PAGE_TITLES_BY_PATH[pathname] ?? pageTitle;

  // Fallback initials circle when avatar image missing
  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "E";

  // Ends session globally (same logout as manager flow)
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-[#F8F9FC]">

      {/* ── Sidebar drawer backdrop ─────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "z-40 flex h-full min-h-0 flex-col",
          isMobile &&
            "fixed inset-y-0 left-0 w-64 max-w-[min(20rem,90vw)] -translate-x-full transform transition-transform duration-300 ease-in-out",
          isMobile && sidebarOpen && "translate-x-0",
          !isMobile && "relative shrink-0 translate-x-0",
          (isMobile === false) && (effectiveCollapsed ? "w-16" : "w-64"),
          isDesktop && "transition-[width] duration-300"
        )}
      >
        <EmployeeSidebar
          onNavigate={() => setSidebarOpen(false)}
          effectiveCollapsed={effectiveCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      </div>

      {/* ── Main column (header + Outlet + bottom tabs) ────── */}
      <div className="min-w-0 flex flex-1 flex-col overflow-hidden transition-[flex] duration-300">

        {/* ── HEADER BAR ────────────────────────────────────── */}
        <header className="min-h-[56px] lg:min-h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10 safe-top">

          {/* Burger + headline */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              className="md:hidden -ml-2 p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition flex items-center justify-center shrink-0 min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="min-w-0">
              <h2 className="font-bold text-[#0f2042] text-xl lg:text-2xl truncate max-w-[160px] sm:max-w-none">
                <span className="sm:hidden">{shortPageTitle}</span>
                <span className="hidden sm:inline">{pageTitle}</span>
              </h2>
              <p className="text-[#94a3b8] text-xs mt-0.5 hidden sm:block truncate">
                Employee Portal / {pageTitle}
              </p>
            </div>
          </div>

          {/* Alerts · quick requests shortcut · profile */}
          <div className="flex items-center gap-3 shrink-0">

            <NotificationBell />

            <button
              type="button"
              onClick={() => navigate("/employee/requests")}
              className="relative min-h-[44px] min-w-[44px] p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-center text-[#1B3F8B] hover:bg-[#dbeafe] transition"
              title="My Requests"
            >
              <ClipboardList size={16} />
            </button>

            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

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
                className="flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3 py-2 min-h-[44px] cursor-pointer hover:bg-[#dbeafe] transition focus:outline-none"
              >
                <div className="w-6 h-6 rounded-full bg-[#1B3F8B] flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0">
                  {user?.profileImage
                    ? <img src={avatarUrl(user.profileImage)} alt="avatar" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="hidden md:block text-left leading-tight min-w-0">
                  <p className="text-[#1B3F8B] text-xs font-semibold truncate max-w-[120px]">{getDisplayName(user, "Employee")}</p>
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
                    py-2 animate-in fade-in zoom-in-95 duration-150
                  "
                >

                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-full bg-[#1B3F8B] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden border-2 border-[#BFDBFE]">
                        {user?.profileImage
                          ? <img src={avatarUrl(user.profileImage)} alt="avatar" className="w-full h-full object-cover" />
                          : initials
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0f2042] truncate">{getDisplayName(user, "Employee")}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EFF6FF] text-[#1B3F8B]">
                      Employee
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { navigate("/employee/profile"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={15} className="text-gray-400" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigate("/employee/myshifts"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Briefcase size={15} className="text-gray-400" />
                      My Shifts
                    </button>

                    <button
                      type="button"
                      onClick={() => { navigate("/employee/requests"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ClipboardList size={15} className="text-gray-400" />
                      My Requests
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
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

        {/* Active route */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden min-h-0",
            "animate-in fade-in duration-200",
            "md:pb-0 pb-20"
          )}
        >
          <Outlet />
        </main>

        {/* Mobile bottom dock */}
        <BottomNav />
      </div>
    </div>
  );
};

export default EmployeeLayout;
