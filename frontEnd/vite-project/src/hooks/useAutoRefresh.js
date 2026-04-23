import { useEffect, useRef } from "react";

const MIN_INTERVAL_MS = 10_000;

/**
 * Automatically calls fetchFn on a polling interval,
 * on page visibility restore, and on window focus.
 * A 10-second minimum guard prevents rapid consecutive calls
 * from the visibility and focus handlers.
 *
 * @param {Function} fetchFn  - The silent fetch function to invoke.
 * @param {number}   interval - Polling interval in ms. Default: 60000.
 * @param {boolean}  enabled  - Set false to suspend all activity. Default: true.
 */
export function useAutoRefresh(fetchFn, interval = 60_000, enabled = true) {
  const isMounted = useRef(false);
  const lastRefreshTime = useRef(0);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    isMounted.current = true;

    const guardedRefresh = () => {
      if (!isMounted.current) return;
      const now = Date.now();
      if (now - lastRefreshTime.current < MIN_INTERVAL_MS) return;
      lastRefreshTime.current = now;
      fetchFnRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        guardedRefresh();
      }
    };

    const handleFocus = () => {
      guardedRefresh();
    };

    const timerId = setInterval(() => {
      if (!isMounted.current) return;
      if (document.visibilityState !== "visible") return;
      fetchFnRef.current();
    }, interval);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted.current = false;
      clearInterval(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, interval]);
}
