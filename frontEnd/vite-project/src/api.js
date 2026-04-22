import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
if (baseURL == null || String(baseURL).trim() === "") {
  throw new Error(
    "VITE_API_URL is not set. For local dev, copy .env.example to .env. Production builds use .env.production."
  );
}

const API = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (err, token = null) => {
  failedQueue.forEach((prom) => (err ? prom.reject(err) : prom.resolve(token)));
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Expected 401 when not logged in — pass through without refresh-queue logic.
    // Callers (AuthContext) use .catch(() => null) so these are not unhandled rejections.
    // Chrome may still log the network request; DevTools Console stays clean if caught.
    const url = original?.url || "";
    if (url.includes("/api/users/me") || url.includes("/refresh-token")) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(original))
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      return API.post("/api/users/refresh-token")
        .then(() => {
          processQueue(null, true);
          return API(original);
        })
        .catch((refreshErr) => {
          processQueue(refreshErr, null);
          isRefreshing = false;
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:logout"));
          }
          return Promise.reject(refreshErr);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    return Promise.reject(err);
  }
);

export default API;