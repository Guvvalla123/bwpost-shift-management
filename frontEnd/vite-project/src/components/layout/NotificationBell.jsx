import { useState, useRef, useEffect, useCallback } from "react";

const MIN_NOTIF_REFRESH_MS = 10_000;
import { useLocation } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import API from "@/api";

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef();
  const lastRefreshTime = useRef(0);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/notifications?page=1&limit=30");
      const payload = res.data?.data;
      setItems(Array.isArray(payload?.notifications) ? payload.notifications : []);
      setUnreadCount(typeof payload?.unreadCount === "number" ? payload.unreadCount : 0);
    } catch (err) {
      console.warn("Notification fetch failed:", err?.message);
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifs();
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  useEffect(() => {
    const guardedRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshTime.current < MIN_NOTIF_REFRESH_MS) return;
      lastRefreshTime.current = now;
      fetchNotifs();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        guardedRefresh();
      }
    };

    const handleFocus = () => {
      guardedRefresh();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchNotifs]);

  const markAllRead = async () => {
    try {
      await API.put("/api/notifications/read-all");
      await fetchNotifs();
    } catch (err) {
      console.warn("Mark all read failed:", err?.message);
    }
  };

  const markOneRead = async (id) => {
    try {
      await API.put(`/api/notifications/${id}/read`);
      await fetchNotifs();
    } catch (err) {
      console.warn("Mark read failed:", err?.message);
    }
  };

  return (
    <div className="relative z-40" ref={bellRef}>
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative min-h-[44px] min-w-[44px] p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-center cursor-pointer text-[#1B3F8B] hover:bg-[#dbeafe] transition"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white"
            aria-hidden
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-full mt-2
            w-80 max-w-[calc(100vw-2rem)]
            bg-white rounded-2xl shadow-xl
            border border-gray-100
            z-40
            max-h-[70vh] overflow-y-auto overflow-x-hidden
            animate-in fade-in zoom-in-95 duration-150
          "
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#1B3F8B]" />
              <p className="text-sm font-bold text-gray-800">Notifications</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllRead();
                }}
                className="flex items-center gap-1 text-xs text-[#1B3F8B] hover:text-[#162d5e] font-semibold transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1B3F8B] rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell size={28} className="mb-2 opacity-40" />
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs mt-0.5">No notifications</p>
              </div>
            ) : (
              items.map((n) => {
                const unread = !n.isRead;
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => {
                      if (unread) markOneRead(n._id);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
                      unread ? "bg-sky-50" : "bg-white"
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900 leading-snug">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-1 leading-snug">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5 bg-slate-50/50">
            <p className="text-[11px] text-gray-400 text-center">
              Auto-refreshes every 60 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
