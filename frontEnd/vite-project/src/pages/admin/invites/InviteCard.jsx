// InviteCard.jsx
// One invite as a mobile card: email, role badge, status, dates, copy when pending.

import React from "react";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui";

const STATUS_STYLES = {
  used: { label: "Registered", cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
};

const ROLE_VARIANT = {
  manager: "navy",
  employee: "success",
};

// getInviteStatus — derive UI status from invite fields (same rules as the main page).
function getInviteStatus(invite) {
  if (invite.usedAt) return "used";
  if (new Date(invite.expiresAt) < new Date()) return "expired";
  return "pending";
}

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

// InviteCard
//
// Props:
// invite     — invite document from API
// onCopyLink — called with the full registration URL when user taps Copy Link
const InviteCard = ({ invite, onCopyLink }) => {
  const st = getInviteStatus(invite);
  const stCfg = STATUS_STYLES[st];
  const borderCls =
    st === "pending"
      ? "border-l-4 border-l-amber-500"
      : st === "used"
        ? "border-l-4 border-l-green-500"
        : "border-l-4 border-l-red-400";
  const statusVariant = st === "pending" ? "warning" : st === "used" ? "success" : "error";
  const roleVariant = invite.role === "manager" ? "navy" : "success";
  const expiresAt = new Date(invite.expiresAt);
  const hoursUntilExpiry = (expiresAt - new Date()) / (1000 * 60 * 60);
  const expiringSoon = st === "pending" && hoursUntilExpiry <= 24;

  const fullLink = `${window.location.origin}/register?invite=${invite.token}`;

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 ${borderCls}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-bold text-sm text-gray-900 break-all flex-1 min-w-0">{invite.email}</p>
        <Badge variant={statusVariant} size="sm" className="shrink-0">
          {stCfg.label}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge variant={roleVariant} size="sm">
          {invite.role?.charAt(0).toUpperCase() + invite.role?.slice(1)}
        </Badge>
        {st === "pending" && (
          <span className={`text-xs ${expiringSoon ? "text-red-500 font-medium" : "text-gray-400"}`}>
            Expires {fmtDate(invite.expiresAt)}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3">Sent {fmtDate(invite.createdAt)}</p>
      <div className="border-t border-gray-100 pt-3">
        {st === "pending" && (
          <button
            type="button"
            onClick={() => onCopyLink(fullLink)}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#1B3F8B]/30 text-[#1B3F8B] text-sm font-semibold hover:bg-[#EFF6FF] transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3F8B]/30"
          >
            <Copy className="w-4 h-4 shrink-0" />
            Copy Link
          </button>
        )}
        {st === "used" && <p className="text-sm text-gray-400 text-center">Link used</p>}
        {st === "expired" && <p className="text-sm text-gray-400 text-center">Expired</p>}
      </div>
    </div>
  );
};

export default InviteCard;
