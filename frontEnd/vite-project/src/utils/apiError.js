/**
 * Matches backend envelopes from sendSuccess / errorHandler:
 * Success: { success: true, data?, message? }
 * Error:   { success: false, error: string, data?: { errors?: { field, message }[] } }
 */

export function unwrapSuccessData(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data;
  }
  return body;
}

export function getApiErrorMessage(err, fallback = "Something went wrong") {
  const d = err?.response?.data;
  if (!d || typeof d !== "object") return fallback;
  if (typeof d.error === "string" && d.error.trim()) return d.error;
  if (typeof d.message === "string" && d.message.trim()) return d.message;
  return fallback;
}

/** Raw Joi-style detail rows, or null */
export function getApiErrorDetailsList(err) {
  const d = err?.response?.data;
  if (!d || typeof d !== "object") return null;
  const list = d.data?.errors ?? d.errors;
  return Array.isArray(list) ? list : null;
}

/** Map API validation details to { fieldName: message } */
export function getApiFieldErrors(err) {
  const list = getApiErrorDetailsList(err);
  if (!list?.length) return null;
  const out = {};
  for (const item of list) {
    if (item?.field != null) out[item.field] = item.message ?? String(item);
  }
  return Object.keys(out).length ? out : null;
}
