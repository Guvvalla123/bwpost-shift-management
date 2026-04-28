// EmployeePhotoUpload.jsx
// Profile picture preview, file input, Cloudinary upload triggered by parent handler.

import React, { useRef } from "react";
import { Camera, Loader2, CheckCircle2, Trash2 } from "lucide-react";

// Section — card header used for the photo block only
function SectionHeader({ title, description }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 md:px-6 md:py-4 border-b border-gray-100 bg-slate-50/60">
      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
        <Camera size={15} className="text-emerald-600" />
      </div>
      <div>
        <h3 className="text-base md:text-lg font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{description}</p>}
      </div>
    </div>
  );
}

// EmployeePhotoUpload
//
// Props:
// currentPhotoUrl — URL or blob URL for preview (after parent updates state)
// userInitials       — two letters when no image
// uploading         — show spinner overlay
// uploadSuccess     — show check badge briefly after success
// onFileSelected    — async (file) => parent runs upload + PUT
// onRemovePhoto     — parent clears server + local preview
const EmployeePhotoUpload = ({
  currentPhotoUrl,
  userInitials,
  uploading,
  uploadSuccess,
  onFileSelected,
  onRemovePhoto,
}) => {
  const fileInputRef = useRef();

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    await onFileSelected(file);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <SectionHeader title="Profile Photo" description="Your photo is shown across the app" />
      <div className="p-4 md:p-6 flex flex-col items-center sm:flex-row sm:items-center gap-6">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg ring-4 ring-emerald-100">
            {currentPhotoUrl ? (
              <img src={currentPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                {userInitials}
              </div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
          {uploadSuccess && !uploading && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <CheckCircle2 size={14} className="text-white" />
            </div>
          )}
        </div>

        <div className="space-y-3 w-full sm:w-auto flex flex-col items-center sm:items-start">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            id="emp-profile-image-input-profilepage"
          />
          <label
            htmlFor="emp-profile-image-input-profilepage"
            className={`w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3 min-h-12 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200
              ${uploading ? "bg-slate-100 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-md hover:scale-[1.02]"}`}
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Camera size={15} /> {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
              </>
            )}
          </label>

          {currentPhotoUrl && !uploading && (
            <button
              type="button"
              onClick={onRemovePhoto}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} /> Remove Photo
            </button>
          )}

          <p className="text-xs text-gray-400 leading-relaxed text-center sm:text-left">
            JPG, PNG or GIF · Max 5MB<br />Uploads securely via Cloudinary
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeePhotoUpload;
