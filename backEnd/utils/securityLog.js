function logEvent(tag, req, extra) {
  const id = req.id || "";
  const ip = req.ip || "";
  const line = { tag, requestId: id, ip, path: req.path, method: req.method, ...extra };
  console.warn("[security]", JSON.stringify(line));
}

module.exports = { logEvent };
