import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-sm font-medium text-gray-600 transition-colors hover:text-[#1B3F8B] dark:text-gray-300 dark:hover:text-[#93C5FD]";

const navLinkUnderline =
  "relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:rounded-full after:bg-[#1B3F8B] after:transition-all after:duration-200 hover:after:w-full dark:after:bg-[#93C5FD]";

const btnPrimary =
  "inline-flex h-9 items-center justify-center rounded-lg bg-[#1B3F8B] px-4 text-sm font-medium text-white shadow-sm shadow-[#1B3F8B]/15 transition hover:bg-[#162d5e] disabled:opacity-50 dark:shadow-slate-900/30";

const btnIcon =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDashboard = () => {
    setMobileOpen(false);
    if (user?.role === "admin") navigate("/admin/dashboard");
    else if (user?.role === "manager") navigate("/manager/dashboard");
    else navigate("/employee/dashboard");
  };

  const NavLinks = ({ mobile = false }) => (
    <nav
      className={cn(
        mobile ? "flex flex-col gap-1" : "hidden items-center gap-8 md:flex",
        !mobile && "text-sm"
      )}
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
    >
      {[
        { to: "/", label: "Home" },
        { to: "/#about", label: "About" },
        { to: "/#products", label: "Services" },
        { to: "/#contact", label: "Contact" },
      ].map(({ to, label }) => (
        <Link
          key={to + label}
          to={to}
          onClick={() => mobile && setMobileOpen(false)}
          className={cn(
            navLinkClass,
            !mobile && navLinkUnderline,
            mobile && "rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );

  const MobilePanel = ({ children }) =>
    mobileOpen ? (
      <>
        <button
          type="button"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className="fixed inset-y-0 right-0 z-[60] flex w-[min(100vw-2rem,20rem)] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-slate-950 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 id="mobile-menu-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Menu
            </h2>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">{children}</div>
        </div>
      </>
    ) : null;

  return (
    <header className="fixed left-0 top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-slate-950/90 dark:shadow-slate-950/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="shrink-0 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl"
          onClick={() => setMobileOpen(false)}
        >
          BW<span className="text-[#1B3F8B] dark:text-[#93C5FD]">POST</span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button type="button" onClick={handleDashboard} className={cn(btnPrimary, "hidden md:inline-flex")}>
                Go to Dashboard
              </button>
              <button
                type="button"
                className={cn(btnIcon, "md:hidden")}
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <MobilePanel>
                <NavLinks mobile />
                <button type="button" onClick={handleDashboard} className={cn(btnPrimary, "h-10 w-full")}>
                  Go to Dashboard
                </button>
              </MobilePanel>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(btnPrimary, "hidden px-5 shadow-[#1B3F8B]/15 dark:shadow-slate-900/40 md:inline-flex")}
              >
                Login
              </Link>
              <button
                type="button"
                className={cn(btnIcon, "md:hidden")}
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <MobilePanel>
                <NavLinks mobile />
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className={cn(btnPrimary, "h-10 w-full text-center")}
                >
                  Login
                </Link>
              </MobilePanel>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
