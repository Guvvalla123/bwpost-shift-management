// SettingsPage.jsx
// Settings page for manager profile and security preferences.
// Manager can update their profile photo, display name,
// notification preferences, and manage active login sessions.
//
// THIS FILE MANAGES STATE AND COORDINATES ACTIONS.
// UI pieces are in separate component files:
// - PhotoUpload.jsx    profile photo with upload/remove
// - ProfileForm.jsx    name email phone department timezone fields
// - ActiveSessions.jsx active login sessions section

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { unwrapSuccessData, getApiErrorMessage } from "@/utils/apiError";
import { SkeletonCard } from "@/components/ui";
import {
  Camera, User, Bell, Shield,
  Save, Loader2, ChevronRight,
} from "lucide-react";

// Import API functions
import {
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  transformCloudinaryUrl,
} from "./settingsApi";

// Import sub-components
import PhotoUpload   from "./PhotoUpload";
import ProfileForm   from "./ProfileForm";
import ActiveSessions from "./ActiveSessions";

// ── Section wrapper ─────────────────────────────────────────────
// Section - card with a labelled header, used for each settings group
function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row with icon and title */}
      <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-slate-50/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Icon size={15} className="text-[#1B3F8B]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800 md:text-lg">{title}</h3>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{description}</p>
          )}
        </div>
      </div>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">{children}</div>
    </div>
  );
}

// ── Toggle row ──────────────────────────────────────────────────
// Toggle - labelled switch component for notification preferences
function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 ${
          checked ? "bg-[#1B3F8B]" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
const SettingsPage = () => {
  // Get the logged-in user and helper functions from auth context
  const { user, loading: authLoading, updateUser } = useAuth();

  // Profile form field values
  const [profile, setProfile] = useState({
    displayName: user?.username || "",
    email:       user?.email    || "",
    phone:       "",
    department:  "Operations",
    timezone:    "Europe/Berlin",
  });

  // Current photo URL shown in the avatar preview
  const [imagePreview, setImagePreview] = useState(
    transformCloudinaryUrl(user?.profileImage || "")
  );

  // True while a photo is being uploaded to Cloudinary
  const [imageUploading, setImageUploading] = useState(false);

  // True briefly after a successful photo upload (shows checkmark)
  const [imageSuccess, setImageSuccess] = useState(false);

  // Notification toggle preferences (local state only — not saved to API)
  const [notifications, setNotifications] = useState({
    shiftRequests:    true,
    shiftReminders:   true,
    attendanceAlert:  false,
    weeklyReport:     true,
    emailNotify:      true,
  });

  // True while the profile save API call is running
  const [saving, setSaving] = useState(false);

  // ── Functions ──────────────────────────────────────────────

  // handleFieldChange - updates a single profile form field
  function handleFieldChange(e) {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // handleToggle - flips a notification toggle value
  // key - the notification preference key to toggle
  function handleToggle(key) {
    return (val) => setNotifications((prev) => ({ ...prev, [key]: val }));
  }

  // handlePhotoChange - called when user picks a new photo file
  // photoFile - the File object from the file input
  async function handlePhotoChange(photoFile) {
    // Show instant local preview before upload finishes
    const localUrl = URL.createObjectURL(photoFile);
    setImagePreview(localUrl);
    setImageUploading(true);
    setImageSuccess(false);

    try {
      const imageUrl = await uploadProfilePhoto(photoFile, updateUser);
      setImagePreview(imageUrl);
      setImageSuccess(true);
      toast.success("Profile photo updated!");
    } catch (err) {
      toast.error(err.message || "Image upload failed. Please try again.");
      setImagePreview(user?.profileImage || "");
    } finally {
      setImageUploading(false);
    }
  }

  // handleRemovePhoto - clears the profile photo
  async function handleRemovePhoto() {
    try {
      await removeProfilePhoto(updateUser);
      setImagePreview("");
      toast.success("Profile photo removed");
    } catch {
      toast.error("Failed to remove photo");
    }
  }

  // handleProfileSave - saves profile changes (username only) to the server
  async function handleProfileSave() {
    setSaving(true);
    try {
      const res     = await updateProfile({ username: profile.displayName });
      const updated = unwrapSuccessData(res);
      updateUser({ username: updated?.username ?? profile.displayName });
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  }

  // initials - 2-letter fallback shown in the avatar when no photo
  const initials = (user?.username || "M")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // ── Loading state ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-full bg-[#F8F9FC] px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* ── Profile Photo section ── */}
      <Section
        icon={Camera}
        title="Profile Photo"
        description="Upload your profile picture — shown across the app"
      >
        <PhotoUpload
          currentPhotoUrl={imagePreview}
          userInitials={initials}
          isUploading={imageUploading}
          uploadSuccess={imageSuccess}
          onPhotoChange={handlePhotoChange}
          onRemovePhoto={handleRemovePhoto}
        />
      </Section>

      {/* ── Profile Information section ── */}
      <Section
        icon={User}
        title="Profile Information"
        description="Update your manager profile details"
      >
        <ProfileForm
          profile={profile}
          onFieldChange={handleFieldChange}
        />
      </Section>

      {/* ── Notifications section ── */}
      <Section
        icon={Bell}
        title="Notifications"
        description="Control what alerts you receive"
      >
        <div className="space-y-3 divide-y divide-slate-50">
          <Toggle
            label="Shift Requests"
            description="Notify when an employee requests a shift"
            checked={notifications.shiftRequests}
            onChange={handleToggle("shiftRequests")}
          />
          <div className="pt-3">
            <Toggle
              label="Shift Reminders"
              description="Get reminders 1 hour before a shift starts"
              checked={notifications.shiftReminders}
              onChange={handleToggle("shiftReminders")}
            />
          </div>
          <div className="pt-3">
            <Toggle
              label="Attendance Alerts"
              description="Alert when an employee misses check-in"
              checked={notifications.attendanceAlert}
              onChange={handleToggle("attendanceAlert")}
            />
          </div>
          <div className="pt-3">
            <Toggle
              label="Weekly Report"
              description="Receive a weekly summary every Monday"
              checked={notifications.weeklyReport}
              onChange={handleToggle("weeklyReport")}
            />
          </div>
          <div className="pt-3">
            <Toggle
              label="Email Notifications"
              description="Send all alerts to your email"
              checked={notifications.emailNotify}
              onChange={handleToggle("emailNotify")}
            />
          </div>
        </div>
      </Section>

      {/* ── Security section ── */}
      <Section
        icon={Shield}
        title="Security"
        description="Account security settings"
      >
        <div className="space-y-3">
          {[
            { label: "Change Password",      desc: "Update your account password",      action: "Coming soon" },
            { label: "Two-Factor Auth (2FA)", desc: "Add an extra layer of security",    action: "Coming soon" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xs text-gray-400 bg-slate-100 px-3 py-1 rounded-full font-medium">
                {item.action}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Active Sessions section ── */}
      <div className="pt-2">
        <ActiveSessions />
      </div>

      {/* ── Save button ── */}
      <div className="flex flex-col sm:flex-row sm:justify-end pt-2">
        <button
          type="button"
          onClick={handleProfileSave}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 h-12 bg-gradient-to-r from-[#1B3F8B] to-blue-600 text-white text-base font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
