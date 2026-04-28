// SendInviteModal.jsx
// Modal to create an invite: email, role, manager (if employee). Optional success link display.

import React, { useState, useEffect } from "react";
import { Modal, Input, Button } from "@/components/ui";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { createInvite } from "./invitesApi";

// SendInviteModal
//
// Props:
// isOpen   — controls visibility
// managers — options for employee manager dropdown
// onClose  — closes modal and should reset parent state
// onSuccess — called after invite is created so parent can refresh the list
const SendInviteModal = ({ isOpen, managers, onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [managerId, setManagerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);

  // Reset form when modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setRole("employee");
      setManagerId("");
      setCreatedLink(null);
    }
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (role === "employee" && !managerId) {
      toast.error("Select a manager for employee invites");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createInvite(email, role, managerId);
      const link = res?.data?.inviteLink;
      toast.success("Invite sent");
      if (link) {
        setCreatedLink(link);
        navigator.clipboard?.writeText(link).then(() => toast.success("Invite link copied"));
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create invite"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseAfterLink() {
    setCreatedLink(null);
    onSuccess?.();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createdLink ? "Invite created" : "Send Invite"}
      footer={
        createdLink ? (
          <Button variant="outline" type="button" fullWidth onClick={handleCloseAfterLink}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="invite-send-form" loading={submitting} loadingText="Sending">
              Send Invite
            </Button>
          </>
        )
      }
    >
      {createdLink ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Share this link with the invitee:</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={createdLink}
              className="flex-1 h-12 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(createdLink);
                toast.success("Copied");
              }}
              className="shrink-0 px-4 min-h-12 bg-[#EFF6FF] text-[#1B3F8B] rounded-xl hover:bg-blue-100 inline-flex items-center gap-2 text-sm font-semibold"
            >
              <Copy size={16} /> Copy
            </button>
          </div>
        </div>
      ) : (
        <form id="invite-send-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="invite-email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B]"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
              <select
                required
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B]"
              >
                <option value="">— Select manager —</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.username} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};

export default SendInviteModal;
