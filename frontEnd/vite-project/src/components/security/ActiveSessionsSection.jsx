import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, LogOut, Monitor } from "lucide-react";
import { toast } from "sonner";
import API from "@/api";
import { unwrapSuccessData, getApiErrorMessage } from "@/utils/apiError";

const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/60">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
        <Icon size={15} className="text-[#1B3F8B]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-800 md:text-lg">{title}</h3>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{description}</p>
        )}
      </div>
    </div>
    <div className="p-4 md:p-6 space-y-4">{children}</div>
  </div>
);

function formatWhen(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

export default function ActiveSessionsSection({ accentClass = "text-[#1B3F8B]", iconWrapperClass = "bg-indigo-100" }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/users/sessions");
      const data = unwrapSuccessData(res);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load sessions"));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeSession = async (id) => {
    setActionId(id);
    try {
      await API.delete(`/api/users/sessions/${id}`);
      toast.success("Session signed out");
      await load();
      const stillHas = await API.get("/api/users/me").catch(() => null);
      if (!stillHas) {
        window.location.replace("/login");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove session"));
    } finally {
      setActionId(null);
    }
  };

  const logoutEverywhere = async () => {
    setActionId("all");
    try {
      await API.delete("/api/users/sessions");
      toast.success("Signed out from all devices");
      setConfirmAll(false);
      localStorage.removeItem("bwpost_has_session");
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/login");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not sign out everywhere"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <Section
      icon={Shield}
      title="Active sessions"
      description="Devices where you stay signed in. Sign out any you do not recognize."
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className={`h-8 w-8 animate-spin ${accentClass}`} />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-slate-500">No active sessions found.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
            >
              <div className="flex gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg ${iconWrapperClass} flex items-center justify-center shrink-0`}
                >
                  <Monitor className={`h-5 w-5 ${accentClass}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 break-words">
                    {s.deviceInfo || "Unknown browser"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">IP: {s.ipAddress || "—"}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Created: {formatWhen(s.createdAt)} · Last active: {formatWhen(s.lastUsedAt)}
                  </p>
                  {s.isCurrent && (
                    <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Current device
                    </span>
                  )}
                </div>
              </div>
              {!s.isCurrent && (
                <button
                  type="button"
                  disabled={actionId === s.id}
                  onClick={() => removeSession(s.id)}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-white min-h-[44px] disabled:opacity-50"
                >
                  {actionId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Sign out this device
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2 border-t border-slate-100">
        {!confirmAll ? (
          <button
            type="button"
            onClick={() => setConfirmAll(true)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-xl border-2 border-red-200 text-red-700 bg-white hover:bg-red-50 transition"
          >
            Sign out from all devices
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <p className="text-sm text-slate-600">Sign out everywhere? You will need to sign in again on this device.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm"
                onClick={() => setConfirmAll(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionId === "all"}
                onClick={logoutEverywhere}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {actionId === "all" ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
