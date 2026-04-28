// ShiftDeleteConfirm.jsx
// Shows a confirmation dialog before deleting a shift.
// Asks the manager to confirm before the delete is permanent.
// This prevents accidental deletions.
//
// HOW IT WORKS:
// 1. Manager clicks the trash icon on a shift
// 2. ShiftsPage.jsx sets shiftToDelete to that shift
// 3. This component appears with the shift title shown
// 4. If manager clicks "Yes, Delete" → onConfirm is called → shift is deleted
// 5. If manager clicks "Cancel" → onCancel is called → dialog closes
//
// The dialog appears centered on screen with a dark backdrop.

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

// ShiftDeleteConfirm - the delete confirmation dialog
//
// Props:
// shift      - the shift that will be deleted
//              used to show the shift title in the warning message
//              if null the dialog is not shown
// isDeleting - true while the delete API call is in progress
//              disables the confirm button to prevent double-clicking
//              shows a spinner inside the button
// onConfirm  - function called when manager clicks "Yes, Delete"
//              this is where the actual delete API call happens
// onCancel   - function called when manager clicks "Cancel"
//              also called when clicking the dark background
//              closes the dialog without deleting anything
const ShiftDeleteConfirm = ({ shift, isDeleting, onConfirm, onCancel }) => {
  // If no shift is set for deletion, don't render anything
  if (!shift) return null;

  return (
    // Dark backdrop — clicking it cancels the delete
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      {/* White dialog box — clicking inside it does NOT close the dialog */}
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          {/* Warning icon in red circle */}
          <div className="w-16 h-16 rounded-full bg-red-50 border-8 border-red-100 flex items-center justify-center mb-5">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900">Delete Shift?</h3>

          {/* Warning message with the shift title bolded */}
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-800">"{shift.shiftTitle}"</span>?
            This action cannot be undone.
          </p>

          {/* Cancel and Confirm buttons */}
          <div className="flex gap-3 w-full">
            {/* Cancel button — gray, closes the dialog */}
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Confirm delete button — red, triggers the delete */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition text-sm disabled:opacity-60"
            >
              {/* Show spinner while delete is in progress */}
              {isDeleting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Deleting…
                </span>
              ) : (
                "Yes, Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftDeleteConfirm;
