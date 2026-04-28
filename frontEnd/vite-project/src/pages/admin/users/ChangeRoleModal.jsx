// ChangeRoleModal.jsx
// Allows admin to change a user's role in the system.
// Shows the user's current role and lets admin select a new one.
// Example uses: promote employee to manager, demote manager to employee.
//
// RULE: If changing to "employee" role, a manager must be selected.
// This is enforced both here in the UI and on the server side.

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, Button } from "@/components/ui";

// inputCls - CSS classes for the select dropdowns in this modal
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-300 text-base focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 md:text-sm";

// ChangeRoleModal - modal to update a user's role
//
// Props:
// isOpen     - true when the modal should be visible on screen
// user       - the user whose role is being changed
//              used to show their name in the modal header
//              also used to pre-select their current role
// managers   - array of active manager objects for the manager dropdown
//              needed when changing a user to the "employee" role
// isUpdating - true while the role change API call is running
//              disables the Update Role button to prevent double-click
// onConfirm  - function called when admin clicks "Update Role"
//              receives (newRole, managerId) as arguments
//              the actual API call happens in UsersPage.jsx
// onCancel   - function called when admin clicks "Cancel"
//              closes the modal without making any changes
const ChangeRoleModal = ({ isOpen, user, managers, isUpdating, onConfirm, onCancel }) => {
  // The role currently selected in the dropdown
  const [selectedRole, setSelectedRole] = useState("employee");

  // The manager selected when role is "employee"
  const [selectedManagerId, setSelectedManagerId] = useState("");

  // When a different user is opened for role change,
  // pre-fill the dropdowns with their current role and manager
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || "employee");
      // Pre-fill the manager if user is currently an employee
      setSelectedManagerId(user.managerId?._id || user.managerId || "");
    }
  }, [user]);

  // handleSubmit - validates and calls onConfirm with the selected values
  function handleSubmit(e) {
    e.preventDefault();

    // Cannot change to employee without selecting a manager
    if (selectedRole === "employee" && !selectedManagerId) {
      toast.error("Employees must be assigned to a manager");
      return;
    }

    // Pass the new role and manager ID up to UsersPage for the API call
    onConfirm(selectedRole, selectedManagerId);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Change Role"
      description={user ? `Updating role for ${user.username} (${user.email})` : ""}
      footer={
        <>
          {/* Cancel button */}
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          {/* Submit button — triggers the form by ID */}
          <Button
            type="submit"
            form="admin-change-role-form"
            loading={isUpdating}
            loadingText="Updating"
          >
            Update Role
          </Button>
        </>
      }
    >
      <form id="admin-change-role-form" onSubmit={handleSubmit} className="space-y-4">
        {/* New role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              // Clear manager selection when switching to a non-employee role
              if (e.target.value !== "employee") setSelectedManagerId("");
            }}
            className={inputCls}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Manager selector — only shown when new role is "employee" */}
        {selectedRole === "employee" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
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
    </Modal>
  );
};

export default ChangeRoleModal;
