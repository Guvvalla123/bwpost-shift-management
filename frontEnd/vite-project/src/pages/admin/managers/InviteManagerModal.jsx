// InviteManagerModal.jsx
// Modal to create an invite link for a new manager.
// Step 1: enter email → Create Invite calls API.
// Step 2: show invite link + Copy button (+ auto-copy toast from parent).

import React from "react";
import { Modal, Input, Button } from "@/components/ui";
import { Copy } from "lucide-react";
import { toast } from "sonner";

// InviteManagerModal — two-step modal (form → link displayed)
//
// Props:
// isOpen           - modal visibility
// onClose          - close and reset modal state in parent
// inviteEmail      - controlled email input value
// setInviteEmail   - updates email input
// onSubmit         - handles form submit for creating invite (parent provides handleInviteSubmit)
// inviteSubmitting - loading state for invite creation
// createdInviteLink - when set (non-null), shows success/link step instead of form
const InviteManagerModal = ({
  isOpen,
  onClose,
  inviteEmail,
  setInviteEmail,
  onSubmit,
  inviteSubmitting,
  createdInviteLink,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createdInviteLink ? "Invite Created" : "Invite Manager"}
      footer={
        createdInviteLink ? (
          <Button variant="outline" type="button" fullWidth onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="mgr-invite-form"
              loading={inviteSubmitting}
              loadingText="Creating"
            >
              Create Invite
            </Button>
          </>
        )
      }
    >
      {createdInviteLink ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Invite created. Share this link with the manager:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={createdInviteLink}
              className="flex-1 h-12 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(createdInviteLink);
                toast.success("Copied");
              }}
              className="shrink-0 px-4 min-h-12 bg-[#EFF6FF] text-[#1B3F8B] rounded-xl hover:bg-blue-100 inline-flex items-center gap-2 text-sm font-semibold"
            >
              <Copy size={16} /> Copy
            </button>
          </div>
        </div>
      ) : (
        <form id="mgr-invite-form" onSubmit={onSubmit} className="space-y-4">
          <Input
            id="mgr-invite-email"
            label="Email Address"
            type="email"
            required
            placeholder="Enter manager email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            autoFocus
          />
        </form>
      )}
    </Modal>
  );
};

export default InviteManagerModal;
