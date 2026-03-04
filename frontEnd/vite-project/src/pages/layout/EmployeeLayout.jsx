import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Settings, User, Bell, ChevronDown, CheckCircle2, ClipboardList } from "lucide-react";
import EmployeeSidebar from "./Employeesidebar";
import { useAuth } from "@/context/AuthContext";
import API from "@/api";

/* ── Sharp Cloudinary avatar ─────────────────────────────── */
const avatarUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/w_96,h_96,c_fill,g_face,q_auto,f_auto/");
};

/* ── Page titles ─────────────────────────────────────────── */
const PAGE_TITLES = {
  "/employee/dashboard": "Dashboard",
  "/employee/AllShifts": "Available Shifts",
  "/employee/myshifts": "My Shifts",
  "/employee/requests": "My Requests",
  "/employee/profile": "My Profile",
};

/* ══════════════════════════════════════════════════════════
   EMPLOYEE LAYOUT
══════════════════════════════════════════════════════════ */
const EmployeeLayout = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const { user, logout } = useAuth();

  const pageTitle = PAGE_TITLES[pathname] ?? "Employee Portal";

  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "E";

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try { await API.post("/api/users/logout"); } catch { }
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <EmployeeSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Navbar (same structure as ManagerLayout) ── */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 shadow-sm shrink-0 sticky top-0 z-30">

          {/* Page title + breadcrumb */}
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">{pageTitle}</h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Employee Portal &nbsp;/&nbsp; {pageTitle}
            </p>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">

            {/* Requests bell — links to My Requests */}
            <button
              onClick={() => navigate("/employee/requests")}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all duration-150"
              title="My Requests"
            >
              <ClipboardList size={16} />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200" />

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2.5 focus:outline-none group"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-emerald-200 shrink-0 group-hover:ring-emerald-400 transition-all duration-200 overflow-hidden">
                  {user?.profileImage
                    ? <img src={avatarUrl(user.profileImage)} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    : initials
                  }
                </div>

                {/* Name + role */}
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-sm font-semibold text-slate-800">{user?.username || "Employee"}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role || "Employee"}</p>
                </div>

                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">

                  {/* Mini profile header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                        {user?.profileImage
                          ? <img src={avatarUrl(user.profileImage)} alt="avatar" className="w-full h-full object-cover" />
                          : initials
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.username || "Employee"}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
                      </div>
                    </div>
                    {/* Role badge */}
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Employee
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { navigate("/employee/myshifts"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User size={15} className="text-slate-400" />
                      My Shifts
                    </button>

                    <button
                      onClick={() => { navigate("/employee/requests"); setProfileOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ClipboardList size={15} className="text-slate-400" />
                      My Requests
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
