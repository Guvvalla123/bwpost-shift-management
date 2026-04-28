// EmployeeProfileForm.jsx
// Grid of profile fields: display name, email (read-only), phone, timezone dropdown.

import React from "react";
import { Clock } from "lucide-react";

// Field — simple labeled text input (same behaviour as legacy profile page)
function Field({ label, name, value, onChange, type = "text", placeholder, disabled, inputMode, autoComplete }) {
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
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="w-full h-12 px-4 rounded-xl text-base text-gray-700 bg-gray-50 border border-gray-200
          hover:border-gray-300 hover:bg-white
          focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:bg-white
          disabled:bg-slate-100 disabled:text-gray-400 disabled:cursor-not-allowed
          transition-all duration-150 placeholder:text-gray-400"
      />
    </div>
  );
}

// EmployeeProfileForm
//
// Props:
// profile    — { displayName, email, phone, timezone }
// onChange   — input change handler for controlled fields
const EmployeeProfileForm = ({ profile, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field
        label="Display Name"
        name="displayName"
        value={profile.displayName}
        onChange={onChange}
        placeholder="Your full name"
        autoComplete="name"
      />
      <Field
        label="Email Address"
        name="email"
        value={profile.email}
        onChange={onChange}
        type="email"
        inputMode="email"
        autoComplete="email"
        disabled
      />
      <Field
        label="Phone Number"
        name="phone"
        value={profile.phone}
        onChange={onChange}
        placeholder="+49 123 456 789"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
      />
      <div className="md:col-span-2 space-y-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Clock size={11} /> Timezone
        </label>
        <select
          name="timezone"
          value={profile.timezone}
          onChange={onChange}
          className="w-full h-12 px-4 rounded-xl text-base text-gray-700 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
        >
          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
          <option value="Europe/Berlin">Europe/Berlin (CET)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          <option value="Asia/Dubai">Asia/Dubai (GST)</option>
        </select>
      </div>
    </div>
  );
};

export default EmployeeProfileForm;
