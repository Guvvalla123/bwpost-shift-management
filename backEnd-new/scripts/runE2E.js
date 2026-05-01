"use strict";

/**
 * One-off E2E runner for QA (cookie jar over HTTP).
 * Usage: SERVER_PORT=5642 node scripts/runE2E.js
 */

const http = require("http");

const port =
  process.env.SERVER_PORT ||
  process.env.PORT ||
  "5500";

const base = `http://127.0.0.1:${port}`;

function parseCookies(headers) {
  const arr = headers["set-cookie"];
  if (!arr || !arr.length) return "";

  const parts = [];

  arr.forEach((line) => {
    const piece = line.split(";")[0].trim();

    if (piece) parts.push(piece);
  });

  return parts.join("; ");
}

function request(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: "127.0.0.1",

      port: Number(port, 10),

      path,

      method,

      headers: {},
    };

    if (data) {
      opts.headers["Content-Type"] =
        "application/json";

      opts.headers["Content-Length"] =
        Buffer.byteLength(data);
    }

    if (cookie) {
      opts.headers.Cookie = cookie;
    }

    const req = http.request(opts, (res) => {
      let raw = "";

      res.on("data", (ch) => (raw += ch));

      res.on("end", () => {
        let json = {};

        try {
          json = raw ? JSON.parse(raw) : {};
        } catch (e) {
          json = {
            parseError: true,

            raw: raw.slice(
              0,

              200
            ),
          };
        }

        resolve({
          status: res.statusCode,

          json,

          cookie: parseCookies(res.headers),

          headers: res.headers,
        });
      });
    });

    req.on("error", reject);

    if (data) req.write(data);

    req.end();
  });
}

async function mergeCookie(
  oldCookie,
  newCookiePart
) {
  if (
    !newCookiePart ||
    !String(newCookiePart).trim()
  )
    return oldCookie || "";

  if (!oldCookie) return newCookiePart;

  const map = {};

  oldCookie.split(";").forEach((p) => {
    const [k, ...rest] = p.split("=");

    if (k && k.trim())
      map[k.trim()] = rest.join("=").trim();
  });

  newCookiePart.split(";").forEach((p) => {
    const [k, ...rest] = p.split("=");

    if (k && k.trim())
      map[k.trim()] = rest.join("=").trim();
  });

  return Object.keys(map)
    .map((k) => k + "=" + map[k])
    .join("; ");
}

function tomorrowAt(
  hour,
  minute,
  addDays
) {
  const d = new Date();

  d.setDate(d.getDate() + (addDays || 1));

  d.setHours(hour, minute, 0, 0);

  return d.toISOString();
}

const results = [];

function log(
  id,
  name,
  pass,
  note
) {
  const row = {
    id,

    name,

    pass: !!pass,

    note: note || "",
  };

  results.push(row);

  console.log(
    `${pass ? "PASS" : "FAIL"} — ${id} ${name}` +
      (note ? ` (${note})` : "")
  );
}

async function main() {
  let adminC = "";

  let mgrC = "";

  let empC = "";

  let shiftId = "";

  let shift2Id = "";

  let leaveReqId = "";

  // TEST 1
  let r = await request(
    "GET",
    "/health",
    null,
    ""
  );

  log(
    1,

    "Health",

    r.status === 200 &&
      r.json.status === "OK"
  );

  // TEST 2
  r = await request(
    "POST",
    "/api/users/login",
    {
      email: "admin@bwpost.com",

      password: "Admin@123!",
    },

    ""
  );

  adminC = await mergeCookie(
    adminC,

    r.cookie
  );

  log(
    2,

    "Admin login",

    r.status === 200 && r.json.success,

    !r.json.success
      ? JSON.stringify(r.json).slice(0, 120)
      : ""
  );

  // TEST 3
  r = await request(
    "GET",
    "/api/users/me",
    null,
    adminC
  );

  log(
    3,

    "Admin profile",

    r.status === 200 && r.json.success
  );

  // TEST 4 — use unique email so reruns do not hit duplicate user
  const inviteEmail =
    "newmanager" +
    Date.now() +
    "@bwpost.de";

  r = await request(
    "POST",

    "/api/invites",

    {
      email: inviteEmail,

      role: "manager",
    },

    adminC
  );

  const inviteLink =
    r.json.data &&
    r.json.data.inviteLink;

  const tokenMatch =
    inviteLink &&
    inviteLink.match(
      /invite=([a-f0-9]+)/i
    );

  let inviteToken =
    tokenMatch &&
    tokenMatch[1];

  log(
    4,

    "Admin create invite (manager)",
    r.status === 201 && r.json.success && inviteToken,

    inviteEmail
  );

  // TEST 5
  r = await request(
    "GET",

    "/api/invites/validate/" + inviteToken,

    null,

    ""
  );

  log(
    5,

    "Validate invite",

    r.status === 200 && r.json.success
  );

  // TEST 6
  r = await request(
    "POST",

    "/api/invites/accept",

    {
      token: inviteToken,

      username: "NewMgr" + Date.now(),

      password: "Manager@123!",
    },

    ""
  );

  log(
    6,

    "Accept invite",

    r.status === 201 && r.json.success
  );

  // TEST 7
  r = await request(
    "POST",

    "/api/users/login",

    {
      email: "manager@bwpost.de",

      password: "Manager@123!",
    },

    ""
  );

  mgrC = await mergeCookie(mgrC, r.cookie);

  log(
    7,

    "Login manager",

    r.status === 200 && r.json.success
  );

  const isoStart =
    tomorrowAt(9, 0, 1);

  const isoEnd =
    tomorrowAt(17, 0, 1);

  // TEST 8
  r = await request(
    "POST",

    "/api/manager/shifts",

    {
      shiftTitle: "Morning Shift",

      shiftStartTime: isoStart,

      shiftEndTime: isoEnd,

      slotsAvailable: 3,
    },

    mgrC
  );

  shiftId =
    r.json.data &&
    r.json.data.shift &&
    r.json.data.shift._id;

  log(
    8,

    "Create shift",

    r.status === 201 && shiftId,
  );

  // TEST 9
  r = await request(
    "GET",

    "/api/manager/shifts",

    null,

    mgrC
  );

  log(
    9,

    "Get all shifts",

    r.status === 200 && r.json.success
  );

  // TEST 10
  r = await request(
    "GET",

    "/api/manager/shifts/dashboard/data",

    null,

    mgrC
  );

  log(
    10,

    "Dashboard data",

    r.status === 200 && r.json.success
  );

  // TEST 11
  r = await request(
    "POST",

    "/api/users/login",

    {
      email: "employee@bwpost.de",

      password: "Employee@123!",
    },

    ""
  );

  empC = await mergeCookie(empC, r.cookie);

  log(
    11,

    "Login employee",

    r.status === 200 && r.json.success
  );

  // TEST 12
  r = await request(
    "GET",

    "/api/employee/shifts/available-shifts",

    null,

    empC
  );

  log(
    12,

    "Available shifts",

    r.status === 200 && r.json.success
  );

  // TEST 13
  r = await request(
    "POST",

    "/api/employee/shifts/applyForShift",

    { shiftId: shiftId },

    empC
  );

  log(
    13,

    "Apply for shift",

    r.status === 200 && r.json.success
  );

  // TEST 14
  r = await request(
    "GET",

    "/api/employee/shifts/myshifts",

    null,

    empC
  );

  const hasApplied =
    (r.json.data &&
      r.json.data.shifts &&
      r.json.data.shifts.length) >
    0;

  log(
    14,

    "My shifts",

    r.status === 200 && r.json.success && hasApplied
  );

  // TEST 15
  r = await request(
    "POST",

    "/api/attendance/checkin",

    { shiftId: shiftId },

    empC
  );

  log(
    15,

    "Check in",

    r.status === 201 && r.json.success
  );

  // TEST 16
  r = await request(
    "POST",

    "/api/attendance/break/start",

    {
      shiftId: shiftId,

      type: "short_break",
    },

    empC
  );

  log(
    16,

    "Start break",

    r.status === 200 && r.json.success
  );

  // TEST 17
  r = await request(
    "POST",

    "/api/attendance/break/end",

    { shiftId: shiftId },

    empC
  );

  log(
    17,

    "End break",

    r.status === 200 && r.json.success
  );

  // TEST 18
  r = await request(
    "POST",

    "/api/attendance/checkout",

    { shiftId: shiftId },

    empC
  );

  log(
    18,

    "Check out",

    r.status === 200 && r.json.success
  );

  // Extra: manager creates second shift for leave flow
  r = await request(
    "POST",

    "/api/users/login",

    {
      email: "manager@bwpost.de",

      password: "Manager@123!",
    },

    ""
  );

  mgrC = await mergeCookie(mgrC, r.cookie);

  const iso2Start =
    tomorrowAt(9, 0, 2);

  const iso2End =
    tomorrowAt(17, 0, 2);

  r = await request(
    "POST",

    "/api/manager/shifts",

    {
      shiftTitle:

        "Second Shift",

      shiftStartTime:

        iso2Start,

      shiftEndTime:

        iso2End,

      slotsAvailable: 3,
    },

    mgrC
  );

  shift2Id =
    r.json.data &&
    r.json.data.shift &&
    r.json.data.shift._id;

  log(
    0,

    "Setup second shift",

    !!shift2Id,

    "prep for TEST 20"
  );

  r = await request(
    "POST",

    "/api/users/login",

    {
      email: "employee@bwpost.de",

      password: "Employee@123!",
    },

    ""
  );

  empC = await mergeCookie(empC, r.cookie);

  r = await request(
    "POST",

    "/api/employee/shifts/applyForShift",

    {
      shiftId: shift2Id,
    },

    empC
  );

  log(
    0,

    "Apply second shift",

    r.status === 200 && r.json.success,

    "prep for TEST 20"
  );

  // TEST 19
  r = await request(
    "GET",

    "/api/attendance/weekly-hours",

    null,

    empC
  );

  log(
    19,

    "Weekly hours",

    r.status === 200 && r.json.success
  );

  // TEST 20
  r = await request(
    "POST",

    "/api/employee/shifts/requests/leave",

    {
      shiftId: shift2Id,

      reason:

        "Family event",
    },

    empC
  );

  leaveReqId =
    r.json.data &&
    r.json.data.request &&
    r.json.data.request._id;

  log(
    20,

    "Leave request",

    r.status === 201 && leaveReqId
  );

  // TEST 21
  r = await request(
    "GET",

    "/api/employee/shifts/requests",

    null,

    empC
  );

  log(
    21,

    "My requests",

    r.status === 200 && r.json.success
  );

  // TEST 22
  r = await request(
    "GET",

    "/api/notifications",

    null,

    empC
  );

  log(
    22,

    "Notifications",

    r.status === 200 && r.json.success
  );

  // TEST 23
  r = await request(
    "PUT",

    "/api/notifications/read-all",

    null,

    empC
  );

  log(
    23,

    "Notifications read-all",

    r.status === 200 &&
      r.json.success
  );

  // TEST 24
  r = await request(
    "POST",

    "/api/users/login",

    {
      email: "manager@bwpost.de",

      password: "Manager@123!",
    },

    ""
  );

  mgrC = await mergeCookie(mgrC, r.cookie);

  log(
    24,

    "Manager login again",

    r.status === 200 && r.json.success
  );

  // TEST 25
  r = await request(
    "GET",

    "/api/manager/requests",

    null,

    mgrC
  );

  log(
    25,

    "Manager all requests",

    r.status === 200 && r.json.success
  );

  // TEST 26
  r = await request(
    "PUT",

    "/api/manager/requests/" +
      leaveReqId +
      "/approve",

    {},

    mgrC
  );

  log(
    26,

    "Approve request",

    r.status === 200 && r.json.success
  );

  // TEST 27
  r = await request(
    "POST",

    "/api/users/login",

    {
      email: "admin@bwpost.com",

      password: "Admin@123!",
    },

    ""
  );

  adminC = await mergeCookie(adminC, r.cookie);

  r = await request(
    "GET",

    "/api/admin/audit-logs?limit=5",

    null,

    adminC
  );

  log(
    27,

    "Audit logs",

    r.status === 200 &&
      r.json.success &&
      r.json.data &&
      Array.isArray(
        r.json.data.logs
      )
  );

  // TEST 28
  r = await request(
    "GET",

    "/api/admin/users?limit=5",

    null,

    adminC
  );

  log(
    28,

    "All users",

    r.status === 200 &&
      r.json.success &&
      r.json.data.users
  );

  // TEST 29
  r = await request(
    "POST",

    "/api/users/logout",

    {},

    adminC
  );

  log(
    29,

    "Logout",

    r.status === 200 &&
      r.json.success
  );

  const fails = results.filter(
    (x) => !x.pass && x.id > 0
  );

  console.log("\n—— Summary ——");

  console.log(
    "Passed:",

    results.filter((x) => x.pass && x.id > 0)
      .length,

    "/",


    results.filter((x) => x.id > 0)
      .length
  );

  if (fails.length) {
    console.log(
      "Failed:",


      fails
        .map(
          (f) =>
            `${f.id} ${f.note}`
        )
        .join(", ")
    );

    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);

  process.exit(1);
});
