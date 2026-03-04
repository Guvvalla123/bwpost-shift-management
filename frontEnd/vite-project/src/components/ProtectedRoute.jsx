import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/* ── Spinner ──────────────────────────────────────────────── */
const Spinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Verifying session…</p>
        </div>
    </div>
);

/* ── Protected Route ──────────────────────────────────────── */
/**
 * requiredRole: "manager" | "employee"
 * redirectTo:  where to send unauthenticated users (default /login)
 */
const ProtectedRoute = ({ requiredRole, redirectTo = "/login" }) => {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;

    // Not logged in → go to login, replace so back-button can't return
    if (!user) return <Navigate to={redirectTo} replace />;

    // Wrong role → send to correct dashboard
    if (requiredRole && user.role !== requiredRole) {
        const fallback = user.role === "manager" ? "/manager/dashboard" : "/employee/dashboard";
        return <Navigate to={fallback} replace />;
    }

    return <Outlet />;
};

/* ── Public Route ─────────────────────────────────────────── */
/**
 * Wraps public pages (/, /login, /register).
 * If the user is already logged in, redirect them to their dashboard
 * so pressing back from the dashboard never shows login again.
 */
export const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;

    // Already authenticated → send to their dashboard
    if (user) {
        const dest = user.role === "manager" ? "/manager/dashboard" : "/employee/dashboard";
        return <Navigate to={dest} replace />;
    }

    return children;
};

export default ProtectedRoute;
