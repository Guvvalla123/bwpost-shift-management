import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // user shape: { id, role, username, email, profileImage }
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = async () => {
        const res = await API.get("/api/users/me");
        setUser(res.data);
        return res.data;
    };

    /* ── Initial session check (runs once on mount) ── */
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await fetchMe();
            } catch {
                // Access token expired — try silent refresh
                try {
                    await API.post("/api/users/refresh-token");
                    await fetchMe();
                } catch {
                    // Both failed — truly unauthenticated
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    /* ── Re-verify auth when user navigates back/forward ── */
    useEffect(() => {
        const handlePopState = async () => {
            // On any browser history nav, re-check the session immediately
            try {
                await fetchMe();
            } catch {
                try {
                    await API.post("/api/users/refresh-token");
                    await fetchMe();
                } catch {
                    // Session invalid — clear user state so ProtectedRoute kicks in
                    setUser(null);
                }
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const login = (userData) => setUser(userData);

    /* ── Logout — clears state immediately ── */
    const logout = () => {
        setUser(null);
        // Best-effort cookie clear — even if the API call fails user state is gone
        API.post("/api/users/logout").catch(() => { });
    };

    // Merge partial updates (e.g. profileImage, username) into user state
    const updateUser = (partial) => setUser(prev => ({ ...prev, ...partial }));

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
