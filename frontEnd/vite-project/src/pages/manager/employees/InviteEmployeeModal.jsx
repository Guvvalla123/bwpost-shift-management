// InviteEmployeeModal.jsx
// Creates an invite link for a new employee to register themselves.
// Manager enters the employee's email address.
// The system generates a unique registration link.
// Manager copies the link and sends it to the employee via WhatsApp.
//
// HOW INVITE LINKS WORK:
// 1. Manager enters employee email address here
// 2. System creates a unique token and stores it in the database
// 3. A registration link is shown with that token embedded
// 4. Manager copies the link and sends it to the employee
// 5. Employee clicks the link and fills in their own details
// 6. Employee account is created automatically on submission
//
// This is different from AddEmployeeModal where manager sets the password.
// With invites, the employee sets their own password during registration.

import React, { useState } from "react";
import { X, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { createInvite } from "./employeeApi";

// inputCls - CSS classes for all input fields in this modal
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base md:text-sm";

// InviteEmployeeModal - modal to generate a registration invite link
//
// Props:
// isOpen    - true when the modal should be visible on screen
// onClose   - function called when modal should close
//             also resets the form and clears any generated link
// onSuccess - function called after invite is successfully created
//             can be used to refresh data if needed
const InviteEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  // Email address typed by the manager
  const [email, setEmail] = useState("");

  // The invite link returned by the server after creation
  // null means no link generated yet — shows the email input form
  // non-null means link is ready — shows the copy screen
  const [inviteLink, setInviteLink] = useState(null);

  // True while the create invite API call is running
  const [submitting, setSubmitting] = useState(false);

  // Don't render if modal is closed
  if (!isOpen) return null;

  // handleClose - resets form and clears link, then closes modal
  function handleClose() {
    setEmail("");
    setInviteLink(null);
    onClose();
  }

  // handleSubmit - calls the invite API to generate a registration link
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setInviteLink(null);
    try {
      const link = await createInvite(email);
      setInviteLink(link);
      toast.success("Invite created");

      // Immediately try to copy the link to clipboard for convenience
      if (link) {
        try {
          await navigator.clipboard.writeText(link);
          toast.success("Invite link copied to clipboard");
        } catch {
          // Clipboard copy failed — user can still manually copy
        }
      }

      // Notify parent that an invite was created
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create invite"));
    } finally {
      setSubmitting(false);
    }
  }

  // handleCopy - copies the invite link to clipboard
  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — please copy manually");
    }
  }

  return (
    // Dark backdrop — clicking outside closes the modal
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      {/* White modal card */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue gradient header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#162d5e] px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Invite Employee</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6">
          {/* STEP 2: Invite link is ready — show it for copying */}
          {inviteLink ? (
            <div className="space-y-4">
              {/* Instruction text */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <Mail className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Invite created! Copy this link and send it to the employee via WhatsApp or email.
                  They will use it to register their account.
                </p>
              </div>

              {/* Link display with copy button */}
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className={`${inputCls} flex-1 bg-gray-50 text-xs`}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 flex items-center gap-2 shrink-0 font-medium text-sm"
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-slate-100 text-gray-700 font-medium rounded-xl hover:bg-slate-200 transition text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            /* STEP 1: Email input form — shown before invite is created */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter employee email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  autoFocus
                />
              </div>

              {/* Cancel and Create buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-[#162d5e] text-white font-semibold rounded-xl hover:shadow-md transition-all text-sm disabled:opacity-60"
                >
                  {submitting ? "Creating…" : "Create Invite"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteEmployeeModal;
