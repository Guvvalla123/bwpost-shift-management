// PhotoUpload.jsx
// Shows the current profile photo with upload and remove buttons.
// Photo is stored on Cloudinary via unsigned upload preset.
// Shows a loading overlay while the upload is in progress.
// Shows a success checkmark after a successful upload.

import React, { useRef } from "react";
import { Camera, Loader2, CheckCircle2, Trash2 } from "lucide-react";

// PhotoUpload - profile photo section with upload and remove controls
//
// Props:
// currentPhotoUrl - URL of the current profile photo
//                   empty string means no photo (shows initials instead)
// userInitials    - 2-letter fallback initials shown when there is no photo
// isUploading     - true while the Cloudinary upload is in progress
// uploadSuccess   - true briefly after a successful upload (shows checkmark)
// onPhotoChange   - function called when user picks a new image file
//                   receives the File object
// onRemovePhoto   - function called when Remove Photo is clicked
const PhotoUpload = ({
  currentPhotoUrl,
  userInitials,
  isUploading,
  uploadSuccess,
  onPhotoChange,
  onRemovePhoto,
}) => {
  // Ref to the hidden file input so we can trigger it from the label button
  const fileInputRef = useRef(null);

  // handleFileChange - called when user picks a file
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onPhotoChange(file);
    // Reset the input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-6">
      {/* Avatar preview circle */}
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2563EB] to-purple-600 shadow-lg ring-4 ring-indigo-100">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
              {userInitials}
            </div>
          )}
        </div>

        {/* Uploading overlay spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
            <Loader2 size={24} className="text-white animate-spin" />
          </div>
        )}

        {/* Success checkmark badge */}
        {uploadSuccess && !isUploading && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
            <CheckCircle2 size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* Buttons and help text */}
      <div className="space-y-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="profile-image-input"
        />

        {/* Upload button — implemented as a label that opens the file picker */}
        <label
          htmlFor="profile-image-input"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 ${
            isUploading
              ? "bg-slate-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#1B3F8B] to-blue-600 text-white hover:shadow-md hover:scale-[1.02]"
          }`}
        >
          {isUploading ? (
            <><Loader2 size={15} className="animate-spin" /> Uploading…</>
          ) : (
            <><Camera size={15} /> {currentPhotoUrl ? "Change Photo" : "Upload Photo"}</>
          )}
        </label>

        {/* Remove photo button — only shown when a photo exists */}
        {currentPhotoUrl && !isUploading && (
          <button
            type="button"
            onClick={onRemovePhoto}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} />
            Remove Photo
          </button>
        )}

        {/* Help text */}
        <p className="text-xs text-gray-400 leading-relaxed">
          JPG, PNG or GIF · Max 5MB<br />
          Uploads securely via Cloudinary
        </p>
      </div>
    </div>
  );
};

export default PhotoUpload;
