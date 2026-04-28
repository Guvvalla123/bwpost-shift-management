// ResetPasswordModal.jsx
// Generates a password reset link for any user in the system.
// Admin copies the link and sends it to the user manually.
//
// WHY NO EMAIL:
// Sending emails requires a custom domain and email service setup.
// For now, reset links are shared manually via WhatsApp or messaging apps.
// This will be automated when a domain and email service is configured.
//
// TWO-STATE DESIGN (same modal, two screens):
// State 1 — resetLink is empty:
//   Shows the user's name and a "Generate Link" button.
//   Admin clicks it to request a new link from the server.
//
// State 2 — resetLink has a value:
//   Shows the link with Copy and WhatsApp share buttons.
//   Admin copies and sends to user.

import React from "react";
import { Copy } from "lucide-react";
import { Modal, Button } from "@/components/ui";

// ResetPasswordModal - handles the full password reset link flow
//
// Props:
// isOpen       - true when the modal should be visible on screen
// user         - the user who needs a password reset
//                used to show their name and email in the modal
// resetLink    - the generated reset link URL string
//                empty string = no link yet (show confirm screen)
//                non-empty   = link ready (show copy screen)
// isGenerating - true while the generate link API call is running
//                disables the Generate button
// onClose      - function called when modal should close
// onGenerate   - function called when admin clicks "Generate Link"
//                the actual API call happens in UsersPage.jsx
// resetData    - full reset data object from server
//                may include userEmail and expiresAt metadata
const ResetPasswordModal = ({
  isOpen,
  user,
  resetLink,
  isGenerating,
  onClose,
  onGenerate,
  resetData,
}) => {
  // handleCopy - copies the reset link to the clipboard with fallback
  async function handleCopy() {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = resetLink;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      finally { document.body.removeChild(textarea); }
    }
  }

  // handleWhatsApp - opens WhatsApp with the reset link pre-filled
  function handleWhatsApp() {
    if (!resetLink) return;
    const text = `Your password reset link (expires in 1 hour): ${resetLink}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resetLink ? "Password Reset Link" : "Generate Password Reset Link"}
      size={resetLink ? "lg" : undefined}
      footer={
        /* Footer changes based on which state we're in */
        resetLink ? (
          /* State 2 footer: just a Close button */
          <Button variant="outline" type="button" fullWidth onClick={onClose}>
            Close
          </Button>
        ) : (
          /* State 1 footer: Cancel and Generate buttons */
          <>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={isGenerating}
              loadingText="Generating"
              onClick={onGenerate}
            >
              Generate Link
            </Button>
          </>
        )
      }
    >
      {/* STATE 1: No link yet — show confirm prompt */}
      {!resetLink && user && (
        <p className="text-sm text-gray-600">
          Generate a reset link for{" "}
          <span className="font-semibold">{user.username}</span>{" "}
          ({user.email})?
        </p>
      )}

      {/* STATE 2: Link is ready — show it for copying */}
      {resetLink && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Share this link with the user via WhatsApp or any messenger.{" "}
            <span className="font-medium text-gray-800">Link expires in 1 hour</span>{" "}
            (or per server setting).
          </p>

          {/* Show extra metadata if available */}
          {resetData?.userEmail && (
            <p className="text-xs text-gray-500">For: {resetData.userEmail}</p>
          )}
          {resetData?.expiresAt && (
            <p className="text-xs text-gray-500">
              Expires: {new Date(resetData.expiresAt).toLocaleString()}
            </p>
          )}

          {/* Link input with Copy and WhatsApp buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={resetLink}
              className="flex-1 h-12 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-xs text-gray-800"
            />
            <div className="flex gap-2 shrink-0">
              {/* Copy Link button */}
              <Button type="button" size="md" onClick={handleCopy} leftIcon={Copy}>
                Copy Link
              </Button>
              {/* WhatsApp share button */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="px-3 min-h-11 border border-gray-200 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ResetPasswordModal;
