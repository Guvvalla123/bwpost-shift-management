// AddManagerModal.jsx
// Modal form to create a new manager account directly.
// Fields: username, email, password.

import React from "react";
import { Modal, Input, Button } from "@/components/ui";

// AddManagerModal — wrapper around Modal + form for creating a manager
//
// Props:
// isOpen   - controls visibility of the modal
// onClose  - called when Cancel is clicked or modal backdrop closes
// form     - object { username, email, password }
// onChange - receives synthetic event when a field changes
// onSubmit - called when the form submits (caller handles API)
// submitting - disables submit button while saving
const AddManagerModal = ({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  submitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Manager"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="mgr-add-form"
            loading={submitting}
            loadingText="Creating"
          >
            Create Manager
          </Button>
        </>
      }
    >
      <form id="mgr-add-form" onSubmit={onSubmit} className="space-y-4">
        <Input
          id="mgr-add-username"
          name="username"
          label="Username"
          type="text"
          required
          placeholder="Enter username"
          value={form.username}
          onChange={onChange}
          autoFocus
        />
        <Input
          id="mgr-add-email"
          name="email"
          label="Email Address"
          type="email"
          required
          placeholder="Enter email"
          value={form.email}
          onChange={onChange}
        />
        <Input
          id="mgr-add-password"
          name="password"
          label="Password"
          type="password"
          required
          placeholder="Min 8 chars, uppercase, lowercase, number, special"
          value={form.password}
          onChange={onChange}
          minLength={8}
        />
      </form>
    </Modal>
  );
};

export default AddManagerModal;
