// RequestCard.jsx
// Shows ONE shift request as a card on mobile screens.
// Displays employee avatar, name, request type badge,
// reason text, date submitted, and approve/reject buttons.
// Buttons are only shown for pending requests.

import React from "react";
import {
  CheckCircle2, XCircle, Clock,
  LogOut as LeaveIcon, ArrowRightLeft,
} from "lucide-react";

// GRADS - gradient colors for employee avatar circles
// Each employee gets a consistent color based on their name's first letter
const GRADS = [
  "from-blue-500 to-[#162d5e]",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-600",
];

// getGradient - picks a gradient based on the first character of a name
function getGradient(name = "") {
  return GRADS[(name.charCodeAt(0) || 0) % GRADS.length];
}

// getInitials - returns 2 uppercase initials from a name
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

// TYPE_CFG - badge style config for each request type
const TYPE_CFG = {
  leave:        { label: "Leave",        Icon: LeaveIcon,       badge: "bg-red-100 text-red-700 border-red-200" },
  shift_change: { label: "Shift Change", Icon: ArrowRightLeft,  badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

// RequestCard - displays one shift request as a mobile card
//
// Props:
// request      - the request object to display
//                must have: employee, currentShift, status, type, reason, createdAt
// isProcessing - true while an API call is running for this request
//                disables the approve and reject buttons
// onApprove    - function called when the Approve button is clicked
//                receives the request object
// onReject     - function called when the Reject button is clicked
//                opens the RejectNoteModal for this request
const RequestCard = ({ request, isProcessing, onApprove, onReject }) => {
  const status  = request.status || "pending";
  const typeCfg = TYPE_CFG[request.type] || TYPE_CFG.leave;
  const TypeIcon = typeCfg.Icon;

  // Status icon — shown in top-right of the card
  const statusIcon =
    status === "approved" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
    status === "rejected" ? <XCircle className="h-5 w-5 text-red-600" /> :
    <Clock className="h-5 w-5 text-amber-500" />;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* TOP ROW: avatar + employee info + status icon */}
      <div className="mb-3 flex gap-3">
        {/* Gradient avatar circle with initials */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(request.employee?.username)} text-xs font-bold text-white`}
        >
          {getInitials(request.employee?.username || "")}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {request.employee?.username || "Employee"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                {request.currentShift?.shiftTitle || "Shift"}
              </p>
            </div>
            {statusIcon}
          </div>

          {/* Type badge */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${typeCfg.badge}`}>
              <TypeIcon className="h-3 w-3" />
              {typeCfg.label}
            </span>
          </div>

          {/* Date submitted */}
          <p className="mt-2 text-xs text-gray-400">
            Requested{" "}
            {request.createdAt
              ? new Date(request.createdAt).toLocaleDateString(undefined)
              : "—"}
          </p>
        </div>
      </div>

      {/* Reason text (if provided) */}
      {request.reason ? (
        <blockquote className="mb-3 border-l-4 border-gray-200 bg-gray-50 py-2 pl-3 text-sm text-gray-600">
          {request.reason}
        </blockquote>
      ) : null}

      {/* Approve and Reject buttons — only shown for pending requests */}
      {status === "pending" && (
        <div className="flex w-full flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onApprove(request)}
            disabled={isProcessing}
            className="inline-flex min-h-[44px] w-full flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-60 transition-all duration-150"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(request)}
            disabled={isProcessing}
            className="inline-flex min-h-[44px] w-full flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 active:scale-95 disabled:opacity-60 transition-all duration-150"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestCard;
