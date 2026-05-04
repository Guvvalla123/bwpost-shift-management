// ResetPasswordModal.jsx
// Generates a password reset link for an employee.
// The manager copies the link and sends it to the employee
// via WhatsApp or any other messaging app.
//
// WHY NO EMAIL:
// Sending reset links via email requires a custom domain and
// email service configuration. For now, links are shared manually
// via WhatsApp. This will be automated when a domain is ready.
//
// TWO STATES IN ONE MODAL:
// State 1 — resetLink is empty:
//   Shows the employee name and a "Generate Link" button.
//   Manager clicks it to request a new link from the server.
//
// State 2 — resetLink has a value:
//   Shows the link URL with Copy and WhatsApp share buttons.
//   Manager copies and sends to employee.

import React from 'react'
import { X, Loader2, Copy } from 'lucide-react'

// inputCls - shared input styles for the read-only link display
const inputCls =
  'w-full h-12 px-4 rounded-xl border border-gray-300 bg-gray-50 text-xs focus:outline-none transition'

// ResetPasswordModal - handles the full password reset link flow
//
// Props:
// isOpen       - true when the modal should be visible on screen
// employee     - the employee who needs a password reset
//                used to show their name and email in the modal
// onClose      - function called when modal should close
// resetLink    - the generated reset link URL string
//                empty string means no link has been generated yet
//                non-empty string means the link is ready to copy
// isGenerating - true while the generate link API call is in progress
//                disables the Generate button to prevent double-click
// onGenerate   - function called when manager clicks "Generate Link"
//                the actual API call happens in EmployeesPage.jsx
// resetData    - full reset data object from server
//                may include userEmail and expiresAt metadata
const ResetPasswordModal = ({
  isOpen,
  employee,
  onClose,
  resetLink,
  isGenerating,
  onGenerate,
  resetData,
}) => {
  // Don't render if modal is closed or no employee selected
  if (!isOpen || !employee) return null

  // handleCopy - copies the reset link to the user's clipboard
  async function handleCopy() {
    if (!resetLink) return
    try {
      await navigator.clipboard.writeText(resetLink)
    } catch {
      // Fallback for browsers without clipboard API support
      const textarea = document.createElement('textarea')
      textarea.value = resetLink
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }

  // handleWhatsApp - opens WhatsApp with the reset link pre-filled
  function handleWhatsApp() {
    if (!resetLink) return
    const text = `Your password reset link (expires in 1 hour): ${resetLink}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    // Dark backdrop — clicking outside closes the modal
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* White modal card */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal title */}
        <h2 className="text-lg font-bold text-gray-900">
          {resetLink ? 'Password Reset Link' : 'Generate Password Reset Link'}
        </h2>

        {/* ── STATE 1: No link yet — show confirm prompt ── */}
        {!resetLink && (
          <>
            <p className="text-sm text-gray-600 mt-2">
              Generate a reset link for{' '}
              <span className="font-semibold">{employee.username}</span>
              {employee.email ? ` (${employee.email})` : ''}?
            </p>
            <p className="text-xs text-gray-400 mt-1">
              The link will expire after 1 hour. Share it via WhatsApp.
            </p>

            {/* Cancel and Generate buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="w-full sm:flex-1 py-3 min-h-12 border border-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="w-full sm:flex-1 py-3 min-h-12 bg-[#1B3F8B] text-white font-semibold rounded-xl hover:bg-[#152f6b] inline-flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {isGenerating ? 'Generating…' : 'Generate Link'}
              </button>
            </div>
          </>
        )}

        {/* ── STATE 2: Link is ready — show it for copying ── */}
        {resetLink && (
          <>
            <p className="text-sm text-gray-600 mt-2">
              Share this link with the employee via WhatsApp or any messenger.
              The link expires in 1 hour.
            </p>

            {/* Show extra metadata if available from server response */}
            {resetData?.userEmail && (
              <p className="text-xs text-gray-500 mt-2">
                For: {resetData.userEmail}
              </p>
            )}
            {resetData?.expiresAt && (
              <p className="text-xs text-gray-500 mt-1">
                Expires: {new Date(resetData.expiresAt).toLocaleString()}
              </p>
            )}

            {/* Link input with Copy and WhatsApp buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <input
                type="text"
                readOnly
                value={resetLink}
                className={inputCls}
              />
              <div className="flex gap-2 shrink-0">
                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2.5 min-h-11 bg-[#1B3F8B] text-white rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#152f6b] transition"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                {/* WhatsApp share button */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="px-3 py-2.5 min-h-11 border border-gray-200 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-4 py-2.5 bg-slate-100 text-gray-800 font-medium rounded-xl hover:bg-slate-200 transition text-sm"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordModal
