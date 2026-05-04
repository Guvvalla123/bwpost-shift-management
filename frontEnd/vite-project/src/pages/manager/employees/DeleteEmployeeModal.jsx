// DeleteEmployeeModal.jsx
// Confirmation dialog before deactivating an employee account.
// Shows the employee's name and asks the manager to confirm.
// This prevents accidental removal of the wrong person.
//
// NOTE: The employee is NOT deleted from the database.
// Deactivation means they cannot log in anymore.
// Their historical records (shifts, attendance) are still kept.

import React from 'react'
import { AlertTriangle } from 'lucide-react'

// DeleteEmployeeModal - confirmation dialog for employee deactivation
//
// Props:
// isOpen     - true when the dialog should be visible on screen
// employee   - the employee object about to be deactivated
//              used to show their name in the warning message
// isRemoving - true while the deactivate API call is running
//              disables the confirm button to prevent double-click
// onConfirm  - function called when manager clicks "Yes, Deactivate"
//              this is where the actual API call happens (in EmployeesPage)
// onCancel   - function called when manager clicks "Cancel"
//              closes the dialog without making any changes
const DeleteEmployeeModal = ({
  isOpen,
  employee,
  isRemoving,
  onConfirm,
  onCancel,
}) => {
  // If not open or no employee selected, don't show anything
  if (!isOpen || !employee) return null

  return (
    // Dark backdrop — clicking outside dismisses without deleting
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      {/* White confirmation card */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Centered content */}
        <div className="flex flex-col items-center text-center">
          {/* Red warning icon */}
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900">
            Deactivate Employee?
          </h3>

          {/* Message showing who will be deactivated */}
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Are you sure you want to deactivate{' '}
            <span className="font-semibold text-gray-800">
              {employee.username}
            </span>
            ? They will no longer be able to log in.
          </p>

          {/* Action buttons side by side */}
          <div className="flex gap-3 w-full">
            {/* Cancel button */}
            <button
              type="button"
              onClick={onCancel}
              disabled={isRemoving}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm disabled:opacity-60"
            >
              Cancel
            </button>

            {/* Confirm deactivate button — red to signal danger */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isRemoving}
              className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition text-sm disabled:opacity-60"
            >
              {isRemoving ? 'Deactivating…' : 'Yes, Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteEmployeeModal
