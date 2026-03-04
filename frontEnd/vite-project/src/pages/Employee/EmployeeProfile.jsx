import React, { useState, useRef } from "react";
import {
    User, Bell, Camera, Save, Clock,
    Loader2, Trash2, CheckCircle2, Shield,
    ArrowRightLeft, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import API from "@/api";

/* ─── Cloudinary config ──────────────────────────────────── */
const CLOUD_NAME = "ddggugpga";
const UPLOAD_PRESET = "bwpost_profiles";

const transformCloudinaryUrl = (url, opts = "w_400,h_400,c_fill,g_face,q_auto,f_auto") => {
    if (!url || !url.includes("cloudinary.com")) return url;
    return url.replace("/upload/", `/upload/${opts}/`);
};

/* ─── Section wrapper ────────────────────────────────────── */
const Section = ({ icon: Icon, title, description, children, accent = "emerald" }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className={`w-8 h-8 rounded-lg bg-${accent}-100 flex items-center justify-center`}>
                <Icon size={15} className={`text-${accent}-600`} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
        </div>
        <div className="p-6 space-y-4">{children}</div>
    </div>
);

/* ─── Input field ────────────────────────────────────────── */
const Field = ({ label, name, value, onChange, type = "text", placeholder, disabled }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-700 bg-slate-50 border border-slate-200
      hover:border-slate-300 hover:bg-white
      focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:bg-white
      disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
      transition-all duration-150 placeholder:text-slate-400"
        />
    </div>
);

/* ─── Toggle ─────────────────────────────────────────────── */
const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-1">
        <div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${checked ? "bg-emerald-500" : "bg-slate-200"}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </button>
    </div>
);

/* ══════════════════════════════════════════════════════════
   EMPLOYEE PROFILE PAGE
══════════════════════════════════════════════════════════ */
const EmployeeProfile = () => {
    const { user, updateUser } = useAuth();

    const [profile, setProfile] = useState({
        displayName: user?.username || "",
        email: user?.email || "",
        phone: "",
        timezone: "Asia/Kolkata",
    });

    const [imagePreview, setImagePreview] = useState(transformCloudinaryUrl(user?.profileImage || ""));
    const [imageUploading, setImageUploading] = useState(false);
    const [imageSuccess, setImageSuccess] = useState(false);
    const fileInputRef = useRef();

    const [notifications, setNotifications] = useState({
        shiftReminders: true,
        requestUpdates: true,
        emailNotify: false,
    });

    const [saving, setSaving] = useState(false);

    const handleProfileChange = (e) =>
        setProfile(p => ({ ...p, [e.target.name]: e.target.value }));

    /* ── Cloudinary upload ── */
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be smaller than 5MB"); return; }

        setImagePreview(URL.createObjectURL(file));
        setImageUploading(true);
        setImageSuccess(false);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);
            formData.append("folder", "profile_images");

            const cRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: "POST", body: formData,
            });
            if (!cRes.ok) throw new Error("Upload failed");
            const cData = await cRes.json();
            const imageUrl = transformCloudinaryUrl(cData.secure_url);

            await API.put("/api/users/profile", { profileImage: imageUrl });
            updateUser({ profileImage: imageUrl });
            setImagePreview(imageUrl);
            setImageSuccess(true);
            toast.success("Profile photo updated!");
        } catch {
            toast.error("Image upload failed. Please try again.");
            setImagePreview(user?.profileImage || "");
        } finally {
            setImageUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveImage = async () => {
        try {
            await API.put("/api/users/profile", { profileImage: "" });
            updateUser({ profileImage: "" });
            setImagePreview("");
            toast.success("Profile photo removed");
        } catch {
            toast.error("Failed to remove photo");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await API.put("/api/users/profile", { username: profile.displayName });
            updateUser({ username: res.data.username });
            toast.success("Profile saved!");
        } catch {
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const initials = (user?.username || "E").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-3xl">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
            </div>

            {/* ── Profile Photo ───────────────────────────────────── */}
            <Section icon={Camera} title="Profile Photo" description="Your photo is shown across the app" accent="emerald">
                <div className="flex items-center gap-6">
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg ring-4 ring-emerald-100">
                            {imagePreview
                                ? <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
                            }
                        </div>
                        {imageUploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                                <Loader2 size={24} className="text-white animate-spin" />
                            </div>
                        )}
                        {imageSuccess && !imageUploading && (
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="emp-profile-image-input" />
                        <label
                            htmlFor="emp-profile-image-input"
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200
              ${imageUploading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-md hover:scale-[1.02]"}`}
                        >
                            {imageUploading
                                ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
                                : <><Camera size={15} /> {imagePreview ? "Change Photo" : "Upload Photo"}</>
                            }
                        </label>

                        {imagePreview && !imageUploading && (
                            <button onClick={handleRemoveImage} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                                <Trash2 size={14} /> Remove Photo
                            </button>
                        )}

                        <p className="text-xs text-slate-400 leading-relaxed">
                            JPG, PNG or GIF · Max 5MB<br />Uploads securely via Cloudinary
                        </p>
                    </div>
                </div>
            </Section>

            {/* ── Profile Info ────────────────────────────────────── */}
            <Section icon={User} title="Profile Information" description="Update your personal details" accent="emerald">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Display Name" name="displayName" value={profile.displayName} onChange={handleProfileChange} placeholder="Your full name" />
                    <Field label="Email Address" name="email" value={profile.email} onChange={handleProfileChange} type="email" disabled />
                    <Field label="Phone Number" name="phone" value={profile.phone} onChange={handleProfileChange} placeholder="+49 123 456 789" type="tel" />
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={11} /> Timezone
                    </label>
                    <select name="timezone" value={profile.timezone} onChange={handleProfileChange}
                        className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all">
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                </div>
            </Section>

            {/* ── Notifications ───────────────────────────────────── */}
            <Section icon={Bell} title="Notifications" description="Control what alerts you receive" accent="emerald">
                <div className="space-y-3 divide-y divide-slate-50">
                    <Toggle label="Shift Reminders" description="Get reminded before your shift starts" checked={notifications.shiftReminders} onChange={v => setNotifications(n => ({ ...n, shiftReminders: v }))} />
                    <div className="pt-3"><Toggle label="Request Updates" description="Get notified when your request is approved or rejected" checked={notifications.requestUpdates} onChange={v => setNotifications(n => ({ ...n, requestUpdates: v }))} /></div>
                    <div className="pt-3"><Toggle label="Email Notifications" description="Receive alerts via email" checked={notifications.emailNotify} onChange={v => setNotifications(n => ({ ...n, emailNotify: v }))} /></div>
                </div>
            </Section>

            {/* ── Security ────────────────────────────────────────── */}
            <Section icon={Shield} title="Security" description="Account security settings" accent="emerald">
                <div className="space-y-3">
                    {[
                        { label: "Change Password", desc: "Update your account password" },
                        { label: "Two-Factor Auth (2FA)", desc: "Add an extra layer of security" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-medium">Coming soon</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Save ────────────────────────────────────────────── */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? "Saving…" : "Save Profile"}
                </button>
            </div>
        </div>
    );
};

export default EmployeeProfile;
