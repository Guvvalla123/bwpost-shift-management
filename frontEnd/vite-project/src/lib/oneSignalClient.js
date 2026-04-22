import OneSignal from "react-onesignal";
import API from "@/api";

const ONESIGNAL_APP_ID =
  import.meta.env.VITE_ONESIGNAL_APP_ID || "a966e92f-aa24-4fc7-bc58-3e9376674f70";

let initPromise = null;
let changeListenerAttached = false;

function shouldEnableOneSignal() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  const isLocal = h === "localhost" || h === "127.0.0.1";
  return import.meta.env.PROD || !isLocal;
}

/**
 * One-time init + permission + post player id for the logged-in user.
 * Safe to no-op on localhost in development (unless production build).
 */
export async function registerOneSignalForUser() {
  if (!shouldEnableOneSignal()) {
    return;
  }

  if (!initPromise) {
    const isLocal =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    initPromise = OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: "OneSignalSDKWorker.js",
      allowLocalhostAsSecureOrigin: isLocal,
    });
  }

  try {
    await initPromise;
  } catch (err) {
    const msg = err?.message || String(err);
    if (!msg.includes("already initialized")) {
      console.debug("OneSignal init failed:", msg);
      return;
    }
  }

  let granted;
  try {
    granted = await OneSignal.Notifications.requestPermission();
  } catch {
    return;
  }
  if (!granted) {
    return;
  }

  const postId = async (playerId) => {
    if (!playerId) return;
    try {
      await API.post("/api/users/onesignal-player-id", {
        playerId: String(playerId),
      });
    } catch {
      // app continues without server-side player id
    }
  };

  try {
    const currentId = OneSignal.User.PushSubscription.id;
    if (currentId) {
      await postId(currentId);
    }
  } catch {
    // ignore
  }

  if (!changeListenerAttached) {
    changeListenerAttached = true;
    const sub = OneSignal.User.PushSubscription;
    sub.addEventListener("change", (e) => {
      const id = e?.current?.id;
      if (id) {
        postId(id);
      }
    });
  }
}
