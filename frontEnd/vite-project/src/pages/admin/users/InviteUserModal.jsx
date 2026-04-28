// InviteUserModal.jsx
// Creates an invite link for a new user to register themselves.
// Admin enters email and selects a role.
// System generates a unique registration link.
// Admin copies and sends the link to the user via WhatsApp.
//
// TWO-STATE DESIGN:
// State 1 — before creating invite:
//   Shows email input and role selector form.
//   If role is "employee", also shows manager selector.
// State 2 — after invite is created:
//   Hides the form and shows the generated link.
//   Admin can copy it to clipboard.

import React, { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Modal, Input, Button } from "@/components/ui";
import { createInvite } from "./usersApi";

// inputCls - CSS classes for the select dropdowns inside this modal
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-300 text-base focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 md:text-sm";

// InviteUserModal - modal to generate a registration invite link
//
// Props:
// isOpen    - true when the modal should be visible on screen
// managers  - array of manager objects for the manager dropdown
//             used when inviting an employee to assign them a manager
// onClose   - function called when modal should close
// onSuccess - function called after invite is successfully created
const InviteUserModal = ({ isOpen, managers, onClose, onSuccess }) => {
  // Form field values
  const [form, setForm] = useState({
    email:     "",
    role:      "employee",
    managerId: "",
  });

  // The invite link returned by the server after creation
  // null = no link yet (show form)
  // string = link is ready (show copy screen)
  const [inviteLink, setInviteLink] = useState(null);

  // True while the invite creation API call is running
  const [submitting, setSubmitting] = useState(false);

  // handleClose - resets everything and closes the modal
  function handleClose() {
    setForm({ email: "", role: "employee", managerId: "" });
    setInviteLink(null);
    onClose();
  }

  // handleSubmit - validates form and calls the create invite API
  async function handleSubmit(e) {
    e.preventDefault();

    // Employee invites must specify which manager they belong to
    if (form.role === "employee" && !form.managerId) {
      toast.error("Employees must be assigned to a manager");
      return;
    }

    setSubmitting(true);
    setInviteLink(null);
    try {
      const link = await createInvite(form.email, form.role, form.managerId);
      setInviteLink(link);
      toast.success("Invite created");

      // Auto-copy to clipboard for convenience
      if (link) {
        navigator.clipboard?.writeText(link).then(
          () => toast.success("Invite link copied to clipboard")
        );
      }

      // Notify parent that invite was created
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create invite"));
    } finally {
      setSubmitting(false);
    }
  }

  // handleCopyLink - copies the invite link to clipboard
  function handleCopyLink() {
    if (inviteLink) {
      navigator.clipboard?.writeText(inviteLink).then(
        () => toast.success("Copied to clipboard")
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={inviteLink ? "Invite Created" : "Invite User"}
      footer={
        /* Footer changes based on whether invite has been created yet */
        inviteLink ? (
          /* State 2 footer: just a Close button */
          <Button
            variant="outline"
            type="button"
            fullWidth
            onClick={handleClose}
          >
            Close
          </Button>
        ) : (
          /* State 1 footer: Cancel and Create Invite buttons */
          <>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="admin-invite-user-form"
              loading={submitting}
              loadingText="Creating"
            >
              Create Invite
            </Button>
          </>
        )
      }
    >
      {/* STATE 2: Invite link is ready — show it for copying */}
      {inviteLink ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Invite created. Share this link with the user:
          </p>
          {/* Read-only link field with copy button */}
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 h-12 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="shrink-0 px-4 min-h-12 bg-[#EFF6FF] text-[#1B3F8B] rounded-xl hover:bg-blue-100 inline-flex items-center gap-2 text-sm font-semibold"
            >
              <Copy size={16} /> Copy
            </button>
          </div>
        </div>
      ) : (
        /* STATE 1: Email and role input form */
        <form id="admin-invite-user-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <Input
            id="admin-invite-email"
            label="Email"
            type="email"
            required
            placeholder="Enter email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoFocus
          />

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              className={inputCls}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Manager selector — only shown when inviting an employee */}
          {form.role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager <span className="text-red-500">*</span>
              </label>
              <select
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                className={inputCls}
                required
              >
                <option value="">Select a manager</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.username}
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

export default InviteUserModal;
