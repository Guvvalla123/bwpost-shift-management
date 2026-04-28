// EditEmployeeModal.jsx
// Form to edit an existing employee's account details.
// Pre-fills the form with the employee's current data.
// Manager can update the username or email address.
// Password is NOT editable here — use ResetPasswordModal for that.

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { updateEmployee } from "./employeeApi";

// inputCls - CSS classes shared by all input fields in this modal
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base md:text-sm";

// Field - wraps a label element around a form input
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    {children}
  </div>
);

// EditEmployeeModal - form to update an existing employee's details
//
// Props:
// isOpen    - true when the modal should be visible on screen
// employee  - the employee object to edit
//             used to pre-fill the form fields (username and email)
//             when this is null, the modal is not shown
// onClose   - function called when modal should close
// onSuccess - function called after employee is successfully updated
//             triggers a list refresh in EmployeesPage.jsx
const EditEmployeeModal = ({ isOpen, employee, onClose, onSuccess }) => {
  // Form values — pre-filled from the employee prop when it changes
  const [formData, setFormData] = useState({ username: "", email: "" });

  // True while the update API call is running
  const [submitting, setSubmitting] = useState(false);

  // When the employee prop changes (a different employee is selected to edit),
  // update the form fields to show that employee's current values.
  useEffect(() => {
    if (employee) {
      setFormData({
        username: employee.username || "",
        email:    employee.email    || "",
      });
    }
  }, [employee]);

  // Don't render if modal is closed or no employee selected
  if (!isOpen || !employee) return null;

  // handleClose - closes the modal without saving changes
  function handleClose() {
    onClose();
  }

  // handleSubmit - sends the updated username and email to the server
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Only username and email can be changed here
      await updateEmployee(employee._id, {
        username: formData.username,
        email:    formData.email,
      });
      toast.success("Employee updated successfully");

      // Tell parent to refresh the employee list
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update employee"));
    } finally {
      setSubmitting(false);
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
          <h2 className="text-lg font-bold text-white">Edit Employee</h2>
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
            {/* Username field — pre-filled from employee.username */}
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

            {/* Email field — pre-filled from employee.email */}
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

            {/* Cancel and Save buttons */}
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
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
