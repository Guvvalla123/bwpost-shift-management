// ProfilePage.jsx
// Employee profile: photo, personal fields, notification toggles, security placeholders, sessions.

import React, { useState, useEffect } from "react";
import { User, Bell, Save, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

import {
  getSessions,
  logoutSession,
  logoutAllSessions,
  uploadPhoto,
  updateProfile,
  transformCloudinaryUrl,
  getApiErrorMessage,
} from "./profileApi";

import EmployeeProfileForm   from "./EmployeeProfileForm";
import EmployeePhotoUpload   from "./EmployeePhotoUpload";
import EmployeeSessionsSection from "./EmployeeSessionsSection";

import { SkeletonCard, ErrorState } from "@/components/ui";

// Section — generic card with icon header (notifications, security)
function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 md:px-6 md:py-4 border-b border-gray-100 bg-slate-50/60">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Icon size={15} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-800">{title}</h3>
          {description && <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{description}</p>}
        </div>
      </div>
      <div className="p-4 md:p-6 space-y-4">{children}</div>
    </div>
  );
}

// Toggle — local notification preference UI (not persisted in original page)
function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${checked ? "bg-emerald-500" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();

  // Local profile fields (displayName mirrors username in save payload)
  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    phone: "",
    timezone: "Asia/Kolkata",
  });

  // Current image URL for preview (remote or blob)
  const [imagePreview, setImagePreview] = useState("");

  // True while Cloudinary + PUT profile runs
  const [imageUploading, setImageUploading] = useState(false);

  // Brief success checkmark on photo after upload
  const [imageSuccess, setImageSuccess] = useState(false);

  // Notification toggles (same local state as legacy page)
  const [notifications, setNotifications] = useState({
    shiftReminders: true,
    requestUpdates: true,
    emailNotify: false,
  });

  // True while saving profile (username only to API, same as original)
  const [isSaving, setIsSaving] = useState(false);

  // Inline feedback string (errors or success text)
  const [message, setMessage] = useState("");

  // Session list from server
  const [sessions, setSessions] = useState([]);

  // True while GET sessions is running
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Sync profile + image preview from auth user
  useEffect(() => {
    if (!user) return;
    setProfile((p) => ({
      ...p,
      displayName: user.username || "",
      email: user.email || "",
    }));
    setImagePreview(transformCloudinaryUrl(user.profileImage || ""));
  }, [user]);

  const handleProfileChange = (e) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  // loadSessions — refreshes devices list
  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const list = await getSessions();
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user]);

  // handlePhotoChange — after upload resolves with final URL (also updates AuthContext upstream)
  function handlePhotoChange(newPhotoUrl) {
    setImagePreview(newPhotoUrl);
    setImageSuccess(true);
  }

  async function handleFileSelected(file) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    setImageSuccess(false);
    try {
      const imageUrl = await uploadPhoto(file);
      updateUser({ profileImage: imageUrl });
      handlePhotoChange(imageUrl);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Image upload failed. Please try again.");
      setImagePreview(transformCloudinaryUrl(user?.profileImage || ""));
    } finally {
      setImageUploading(false);
    }
  }

  async function handleRemoveImage() {
    try {
      await updateProfile({ profileImage: "" });
      updateUser({ profileImage: "" });
      setImagePreview("");
      toast.success("Profile photo removed");
    } catch {
      toast.error("Failed to remove photo");
    }
  }

  // handleSaveProfile — receives profile object; only username is persisted (legacy behaviour).
  async function handleSaveProfile(profileData) {
    setIsSaving(true);
    setMessage("");
    try {
      const updated = await updateProfile({ username: profileData.displayName });
      updateUser({ username: updated?.username ?? profileData.displayName });
      setMessage("");
      toast.success("Profile saved!");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to save profile");
      setMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoutSession(sessionId) {
    await logoutSession(sessionId);
    await loadSessions();
  }

  async function handleLogoutAll() {
    await logoutAllSessions();
  }

  const initials = (user?.username || "E").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  if (authLoading) {
    return (
      <div className="p-6">
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#F8F9FC] p-6">
        <ErrorState
          title="Could not load profile"
          description="Please try again or sign in."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
        </div>
      </div>

      <EmployeePhotoUpload
        currentPhotoUrl={imagePreview}
        userInitials={initials}
        uploading={imageUploading}
        uploadSuccess={imageSuccess && !imageUploading}
        onFileSelected={handleFileSelected}
        onRemovePhoto={handleRemoveImage}
      />

      <Section icon={User} title="Profile Information" description="Update your personal details">
        <EmployeeProfileForm profile={profile} onChange={handleProfileChange} />
      </Section>

      <Section icon={Bell} title="Notifications" description="Control what alerts you receive">
        <div className="space-y-3 divide-y divide-slate-50">
          <Toggle
            label="Shift Reminders"
            description="Get reminded before your shift starts"
            checked={notifications.shiftReminders}
            onChange={(v) => setNotifications((n) => ({ ...n, shiftReminders: v }))}
          />
          <div className="pt-3">
            <Toggle
              label="Request Updates"
              description="Get notified when your request is approved or rejected"
              checked={notifications.requestUpdates}
              onChange={(v) => setNotifications((n) => ({ ...n, requestUpdates: v }))}
            />
          </div>
          <div className="pt-3">
            <Toggle
              label="Email Notifications"
              description="Receive alerts via email"
              checked={notifications.emailNotify}
              onChange={(v) => setNotifications((n) => ({ ...n, emailNotify: v }))}
            />
          </div>
        </div>
      </Section>

      <Section icon={Shield} title="Security" description="Account security settings">
        <div className="space-y-3">
          {[
            { label: "Change Password", desc: "Update your account password" },
            { label: "Two-Factor Auth (2FA)", desc: "Add an extra layer of security" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xs text-gray-400 bg-slate-100 px-3 py-1 rounded-full font-medium">Coming soon</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="pt-2">
        <EmployeeSessionsSection
          sessions={sessions}
          loadingSessions={loadingSessions}
          onLogoutSession={handleLogoutSession}
          onLogoutAll={handleLogoutAll}
          accentClass="text-emerald-600"
          iconWrapperClass="bg-emerald-100"
        />
      </div>

      <div className="flex flex-col items-stretch sm:items-end pt-2">
        {message && <p className="text-sm text-red-600 mb-2 max-w-md text-right">{message}</p>}
        <button
          type="button"
          onClick={() => handleSaveProfile(profile)}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 min-h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isSaving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
