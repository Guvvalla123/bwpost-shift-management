// AddEmployeeModal.jsx
// Form to add a new employee directly to the team.
// Manager fills in username, email, and password.
// After submitting, the employee account is created immediately.
//
// This is different from InviteEmployeeModal which sends a link.
// This modal creates the account right away with a set password.

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { addEmployee } from "./employeeApi";

// ── Shared style constants ─────────────────────────────────────
// inputCls - CSS classes for all input fields in the modal
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base md:text-sm";

// Field - small helper that wraps a label around a form input
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    {children}
  </div>
);

// AddEmployeeModal - form to create a new employee account
//
// Props:
// isOpen    - true when the modal should be visible on screen
//             false when it should be hidden
// onClose   - function called when modal should close
//             resets the form back to empty fields
// onSuccess - function called after employee is successfully created
//             refreshes the employee list in EmployeesPage.jsx
const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  // Form field values — start empty, reset when modal closes
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // True while the create API call is in progress
  // Disables the submit button to prevent double submission
  const [submitting, setSubmitting] = useState(false);

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // handleClose - resets form and calls onClose
  function handleClose() {
    setFormData({ username: "", email: "", password: "" });
    onClose();
  }

  // handleSubmit - validates and submits the create employee form
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Send the new employee data to the server
      await addEmployee(formData);
      toast.success("Employee created successfully");

      // Clear the form fields
      setFormData({ username: "", email: "", password: "" });

      // Tell the parent page to refresh the employee list
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add employee"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Dark backdrop — clicking it closes the modal
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      {/* White modal box */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue gradient header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-[#162d5e] px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add New Employee</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field */}
            <Field label="Username">
              <input
                type="text"
                required
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={inputCls}
                autoFocus
              />
            </Field>

            {/* Email field */}
            <Field label="Email Address">
              <input
                type="email"
                required
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputCls}
              />
            </Field>

            {/* Password field */}
            <Field label="Password">
              <input
                type="password"
                required
                placeholder="Min 8 chars, uppercase, lowercase, number, special"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputCls}
                minLength={8}
              />
            </Field>

            {/* Cancel and Submit buttons */}
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
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Create Employee"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
