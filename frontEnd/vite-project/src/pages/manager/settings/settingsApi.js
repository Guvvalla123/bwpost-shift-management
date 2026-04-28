// settingsApi.js
// All API calls for the settings page.
// Import this file in SettingsPage.jsx.

import API from "@/api";

// Cloudinary config values from .env
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// transformCloudinaryUrl - injects optimisation transforms into a Cloudinary URL
// Returns a 400x400 face-centred crop so the avatar is always sharp.
// url  - original Cloudinary URL
// opts - transform string (defaults to face crop + quality + format)
export function transformCloudinaryUrl(
  url,
  opts = "w_400,h_400,c_fill,g_face,q_auto,f_auto"
) {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/${opts}/`);
}

// updateProfile - saves profile changes to the backend
// profileData - object containing fields to update
//               currently only { username } is saved by the server
// Returns the updated user object
export async function updateProfile(profileData) {
  const response = await API.put("/api/users/profile", profileData);
  return response.data;
}

// uploadProfilePhoto - uploads an image file to Cloudinary then saves URL
// photoFile - the File object selected by the user
// updateUserFn - callback from useAuth to update global auth state
// Returns the final transformed Cloudinary URL
export async function uploadProfilePhoto(photoFile, updateUserFn) {
  // Validate file type
  if (!photoFile.type.startsWith("image/")) {
    throw new Error("Please select an image file");
  }
  // Validate file size (max 5MB)
  if (photoFile.size > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5MB");
  }

  // Upload directly to Cloudinary using unsigned preset
  const formData = new FormData();
  formData.append("file",           photoFile);
  formData.append("upload_preset",  UPLOAD_PRESET);
  formData.append("folder",         "profile_images");

  const cRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!cRes.ok) throw new Error("Cloudinary upload failed");

  const cData     = await cRes.json();
  // Apply face-crop transform so the avatar looks sharp everywhere
  const imageUrl  = transformCloudinaryUrl(cData.secure_url);

  // Save the transformed URL to our own database
  await API.put("/api/users/profile", { profileImage: imageUrl });

  // Update the global auth context so avatar changes everywhere immediately
  if (updateUserFn) updateUserFn({ profileImage: imageUrl });

  return imageUrl;
}

// removeProfilePhoto - clears the profile photo from the backend
// updateUserFn - callback from useAuth to update global auth state
export async function removeProfilePhoto(updateUserFn) {
  await API.put("/api/users/profile", { profileImage: "" });
  if (updateUserFn) updateUserFn({ profileImage: "" });
}

// getSessions - gets all active login sessions for the current user
// NOTE: Session management is handled by the existing ActiveSessionsSection
// component which calls its own endpoints internally.
// This function is kept here for completeness.
export async function getSessions() {
  const response = await API.get("/api/auth/sessions");
  return response.data?.data ?? [];
}

// logoutSession - logs out one specific session by ID
// sessionId - the MongoDB ID of the session to end
export async function logoutSession(sessionId) {
  const response = await API.delete(`/api/auth/sessions/${sessionId}`);
  return response.data;
}

// logoutAllSessions - logs out all active sessions for the current user
export async function logoutAllSessions() {
  const response = await API.delete("/api/auth/sessions");
  return response.data;
}
