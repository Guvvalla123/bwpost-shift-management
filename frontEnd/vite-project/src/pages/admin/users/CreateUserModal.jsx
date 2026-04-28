// CreateUserModal.jsx
// Form for admin to create a new user account directly.
// Admin fills in username, email, password, and role.
// If role is "employee", admin must also select a manager.
// No invite link needed — the account is created immediately.

import React, { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Modal, Input, Button } from "@/components/ui";
import { createUser } from "./usersApi";

// inputCls - CSS classes shared by all select/dropdown inputs in this modal
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-gray-300 text-base focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 md:text-sm";

// CreateUserModal - form to create a new user account
//
// Props:
// isOpen    - true when the modal should be visible on screen
// managers  - array of manager user objects for the manager dropdown
//             used when creating an employee to assign them a manager
// onClose   - function called when modal should close
// onSuccess - function called after user is successfully created
//             refreshes the user list in UsersPage.jsx
const CreateUserModal = ({ isOpen, managers, onClose, onSuccess }) => {
  // Form field values — reset when modal closes
  const [form, setForm] = useState({
    username:  "",
    email:     "",
    password:  "",
    role:      "employee",
    managerId: "",
  });

  // True while the create API call is running
  const [submitting, setSubmitting] = useState(false);

  // handleClose - resets form and closes modal
  function handleClose() {
    setForm({ username: "", email: "", password: "", role: "employee", managerId: "" });
    onClose();
  }

  // handleSubmit - validates and sends the create user request to server
  async function handleSubmit(e) {
    e.preventDefault();

    // Employee accounts must be assigned to a manager
    if (form.role === "employee" && !form.managerId) {
      toast.error("Employees must be assigned to a manager");
      return;
    }

    setSubmitting(true);
    try {
      // Build payload — managerId is only sent for employee accounts
      const payload = { ...form };
      if (form.role !== "employee") delete payload.managerId;

      await createUser(payload);

      // Show success message with the role that was created
      const roleLabel = form.role.charAt(0).toUpperCase() + form.role.slice(1);
      toast.success(`${roleLabel} created successfully`);

      // Reset form and tell parent to refresh
      setForm({ username: "", email: "", password: "", role: "employee", managerId: "" });
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create user"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add User"
      footer={
        <>
          {/* Cancel button */}
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancel
          </Button>
          {/* Submit button — triggers form with id */}
          <Button
            type="submit"
            form="admin-add-user-form"
            loading={submitting}
            loadingText="Creating"
          >
            Create User
          </Button>
        </>
      }
    >
      <form id="admin-add-user-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Username field */}
        <Input
          id="admin-add-username"
          label="Username"
          type="text"
          required
          placeholder="Enter username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          autoFocus
        />

        {/* Email field */}
        <Input
          id="admin-add-email"
          label="Email"
          type="email"
          required
          placeholder="Enter email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        {/* Password field */}
        <Input
          id="admin-add-password"
          label="Password"
          type="password"
          required
          placeholder="Min 8 chars, uppercase, lowercase, number, special"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
        />

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
                // Clear managerId when switching away from employee role
                managerId: e.target.value === "employee" ? form.managerId : "",
              })
            }
            className={inputCls}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Manager selector — only shown when role is "employee" */}
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
            {/* Warning if no managers exist yet */}
            {managers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No managers found. Create a manager first.
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CreateUserModal;
