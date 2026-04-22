import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import API from "@/api";
import { unwrapSuccessData } from "@/utils/apiError";
import { toast } from "sonner";

export const AuthContext = createContext(null);

/** UX hint only — not security. Skips /me + refresh calls when no prior login this browser. */
const SESSION_HINT_KEY = "bwpost_has_session";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARN_BEFORE_MS = 2 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const idleTimerRef = useRef(null);
    const warnTimerRef = useRef(null);
    const userRef = useRef(null);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    /** GET /me with silent failure — avoids unhandled rejections when not authenticated. */
    const tryLoadSessionUser = useCallback(async () => {
        const res = await API.get("/api/users/me").catch(() => null);
        if (!res) return false;
        const payload = unwrapSuccessData(res);
        setUser(payload);
        return true;
    }, []);

    const checkAuth = useCallback(async () => {
        if (!localStorage.getItem(SESSION_HINT_KEY)) {
            setUser(null);
            return;
        }

        if (await tryLoadSessionUser()) return;

        const refreshed = await API.post("/api/users/refresh-token").catch(() => null);
        if (!refreshed) {
            setUser(null);
            localStorage.removeItem(SESSION_HINT_KEY);
            return;
        }
        if (!(await tryLoadSessionUser())) {
            setUser(null);
            localStorage.removeItem(SESSION_HINT_KEY);
        }
    }, [tryLoadSessionUser]);

    const logout = useCallback(async () => {
        try {
            setUser(null);
            await API.post("/api/users/logout");
        } catch (err) {
            console.debug("Logout API failed:", err?.message);
        } finally {
            localStorage.removeItem(SESSION_HINT_KEY);
            localStorage.clear();
            sessionStorage.clear();
            setTimeout(() => {
                window.location.replace("/");
            }, 100);
        }
    }, []);

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        if (warnTimerRef.current) {
            clearTimeout(warnTimerRef.current);
        }

        warnTimerRef.current = setTimeout(() => {
            if (userRef.current) {
                toast.warning(
                    "Your session will expire in 2 minutes due to inactivity.",
                    { duration: 10000, id: "idle-warning" }
                );
            }
        }, IDLE_TIMEOUT_MS - WARN_BEFORE_MS);

        idleTimerRef.current = setTimeout(() => {
            if (userRef.current) {
                toast.dismiss("idle-warning");
                logout();
            }
        }, IDLE_TIMEOUT_MS);
    }, [logout]);

    /* ── Initial session check (runs once on mount) ── */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            await checkAuth();
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [checkAuth]);

    /* ── Re-verify auth on history navigation only if session appears lost ── */
    useEffect(() => {
        const handlePop = () => {
            if (!user) {
                checkAuth();
            }
        };
        window.addEventListener("popstate", handlePop);
        return () => window.removeEventListener("popstate", handlePop);
    }, [user, checkAuth]);

    useEffect(() => {
        const handleAuthLogout = () => {
            setUser(null);
            localStorage.removeItem(SESSION_HINT_KEY);
            localStorage.clear();
            sessionStorage.clear();
            setTimeout(() => {
                window.location.replace("/");
            }, 100);
        };
        window.addEventListener("auth:logout", handleAuthLogout);
        return () => window.removeEventListener("auth:logout", handleAuthLogout);
    }, []);

    const oneSignalUserRef = useRef(null);

    useEffect(() => {
        if (!user?.id) {
            oneSignalUserRef.current = null;
            return;
        }
        if (oneSignalUserRef.current === user.id) {
            return;
        }
        oneSignalUserRef.current = user.id;
        import("@/lib/oneSignalClient")
            .then(({ registerOneSignalForUser }) => registerOneSignalForUser())
            .catch(() => {});
    }, [user?.id]);

    /* ── Idle auto-logout (15 min, warn at 13 min) ── */
    useEffect(() => {
        if (!user) return;

        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "touchstart",
            "scroll",
            "visibilitychange",
        ];

        events.forEach((ev) =>
            window.addEventListener(ev, resetIdleTimer, { passive: true })
        );

        resetIdleTimer();

        return () => {
            events.forEach((ev) =>
                window.removeEventListener(ev, resetIdleTimer)
            );
            clearTimeout(idleTimerRef.current);
            clearTimeout(warnTimerRef.current);
        };
    }, [user, resetIdleTimer]);

    const login = (userData) => {
        localStorage.setItem(SESSION_HINT_KEY, "1");
        setUser(userData);
    };

    const updateUser = (partial) => setUser(prev => ({ ...prev, ...partial }));

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export { useAuth } from "./useAuth";
