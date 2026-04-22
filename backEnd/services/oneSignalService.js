/**
 * OneSignal web push using the REST API (https://api.onesignal.com/notifications).
 * Optional: if ONESIGNAL_APP_ID or ONESIGNAL_API_KEY is missing, send functions no-op.
 */

const API_URL = "https://api.onesignal.com/notifications";

let state = {
  appId: null,
  apiKey: null,
  enabled: false,
  initialized: false,
};

/**
 * Load credentials from the environment. Call once at server startup.
 * @returns {{ appId: string|null, apiKey: string|null, enabled: boolean }}
 */
function initOneSignal() {
  if (state.initialized) {
    return {
      appId: state.appId,
      apiKey: state.apiKey,
      enabled: state.enabled,
    };
  }
  state.initialized = true;
  state.appId = process.env.ONESIGNAL_APP_ID || null;
  state.apiKey = process.env.ONESIGNAL_API_KEY || null;
  state.enabled = Boolean(state.appId && state.apiKey);
  if (state.enabled) {
    console.log("OneSignal push: configured (REST).");
  } else {
    console.log(
      "OneSignal push: disabled (set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY to enable)."
    );
  }
  return {
    appId: state.appId,
    apiKey: state.apiKey,
    enabled: state.enabled,
  };
}

async function postNotification(body) {
  if (!state.enabled) {
    return { skipped: true, reason: "not_configured" };
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Key ${state.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OneSignal HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return parsed;
}

/**
 * @param {string} oneSignalPlayerId
 * @param {string} title
 * @param {string} message
 * @param {object} [data] optional extra data payload
 */
async function sendPushToUser(oneSignalPlayerId, title, message, data) {
  if (!oneSignalPlayerId || !state.enabled) {
    return;
  }
  try {
    const body = {
      app_id: state.appId,
      include_subscription_ids: [oneSignalPlayerId],
      headings: { en: title },
      contents: { en: message },
    };
    if (data && typeof data === "object" && Object.keys(data).length) {
      body.data = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === undefined || v === null) continue;
        body.data[k] = typeof v === "string" ? v : String(v);
      }
    }
    const result = await postNotification(body);
    console.log("OneSignal sendPushToUser success:", {
      id: oneSignalPlayerId,
      resultId: result?.id,
    });
  } catch (err) {
    console.error("OneSignal sendPushToUser failed:", err.message);
  }
}

/**
 * @param {string[]} oneSignalPlayerIds
 * @param {string} title
 * @param {string} message
 * @param {object} [data] optional
 */
async function sendPushToUsers(oneSignalPlayerIds, title, message, data) {
  const ids = (oneSignalPlayerIds || []).filter(
    (x) => typeof x === "string" && x.trim()
  );
  if (!ids.length || !state.enabled) {
    return;
  }
  try {
    const body = {
      app_id: state.appId,
      include_subscription_ids: ids,
      headings: { en: title },
      contents: { en: message },
    };
    if (data && typeof data === "object" && Object.keys(data).length) {
      body.data = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === undefined || v === null) continue;
        body.data[k] = typeof v === "string" ? v : String(v);
      }
    }
    const result = await postNotification(body);
    console.log("OneSignal sendPushToUsers success:", {
      count: ids.length,
      resultId: result?.id,
    });
  } catch (err) {
    console.error("OneSignal sendPushToUsers failed:", err.message);
  }
}

/**
 * @param {string} segment e.g. "All"
 * @param {string} title
 * @param {string} message
 */
async function sendPushToSegment(segment, title, message) {
  if (!state.enabled) {
    return;
  }
  if (!segment || typeof segment !== "string") {
    return;
  }
  try {
    const body = {
      app_id: state.appId,
      included_segments: [segment],
      headings: { en: title },
      contents: { en: message },
    };
    const result = await postNotification(body);
    console.log("OneSignal sendPushToSegment success:", {
      segment,
      resultId: result?.id,
    });
  } catch (err) {
    console.error("OneSignal sendPushToSegment failed:", err.message);
  }
}

module.exports = {
  initOneSignal,
  sendPushToUser,
  sendPushToUsers,
  sendPushToSegment,
};
