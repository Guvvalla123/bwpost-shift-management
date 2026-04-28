// ProfileForm.jsx
// Form for editing profile information: name, email, phone, department, timezone.
// Email field is disabled — the user cannot change their email.
// Only the Display Name (username) is actually saved to the server.
// Phone, department, and timezone are UI-only fields for now.

import React from "react";
import { Clock } from "lucide-react";

// Field - reusable labelled input component
function Field({ label, name, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-12 px-4 rounded-xl text-base text-gray-700 bg-gray-50 border border-gray-200
          hover:border-gray-300 hover:bg-white
          focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B] focus:bg-white
          disabled:bg-slate-100 disabled:text-gray-400 disabled:cursor-not-allowed
          transition-all duration-150 placeholder:text-gray-400"
      />
    </div>
  );
}

// ProfileForm - editable profile information fields
//
// Props:
// profile        - object with { displayName, email, phone, department, timezone }
// onFieldChange  - function called when any field changes
//                  receives the synthetic event (e.target.name and e.target.value)
const ProfileForm = ({ profile, onFieldChange }) => {
  return (
    <>
      {/* 2-column grid for most fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Display Name"
          name="displayName"
          value={profile.displayName}
          onChange={onFieldChange}
          placeholder="Your full name"
        />
        <Field
          label="Email Address"
          name="email"
          value={profile.email}
          onChange={onFieldChange}
          type="email"
          disabled
        />
        <Field
          label="Phone Number"
          name="phone"
          value={profile.phone}
          onChange={onFieldChange}
          placeholder="+49 123 456 789"
          type="tel"
        />
        <Field
          label="Department"
          name="department"
          value={profile.department}
          onChange={onFieldChange}
          placeholder="e.g. Operations"
        />
      </div>

      {/* Timezone selector (full width) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Clock size={11} /> Timezone
        </label>
        <select
          name="timezone"
          value={profile.timezone}
          onChange={onFieldChange}
          className="w-full h-12 px-4 rounded-xl text-base text-gray-700 bg-gray-50 border border-gray-200
            hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 focus:border-[#1B3F8B]
            transition-all duration-150"
        >
          <option value="Europe/Berlin">Europe/Berlin (CET)</option>
          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          <option value="Asia/Dubai">Asia/Dubai (GST)</option>
        </select>
      </div>
    </>
  );
};

export default ProfileForm;
