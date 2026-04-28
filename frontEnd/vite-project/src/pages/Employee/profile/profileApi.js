// profileApi.js
// API calls used by the employee profile page (profile, photo, sessions).

import API from "@/api";
import { unwrapSuccessData, getApiErrorMessage } from "@/utils/apiError";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function transformCloudinaryUrl(url, opts = "w_400,h_400,c_fill,g_face,q_auto,f_auto") {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/${opts}/`);
}

// updateProfile — PUT /api/users/profile (username and/or profileImage)
// profileData — shape expected by backend, e.g. { username } or { profileImage }
export async function updateProfile(profileData) {
  const res = await API.put("/api/users/profile", profileData);
  return unwrapSuccessData(res);
}

// uploadPhoto — uploads image to Cloudinary then saves URL on the user profile (same flow as legacy page).
// photoFile — File from an <input type="file">
// Returns the optimized image URL string.
export async function uploadPhoto(photoFile) {
  const formData = new FormData();
  formData.append("file", photoFile);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "profile_images");

  const cRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!cRes.ok) throw new Error("Upload failed");
  const cData = await cRes.json();
  const imageUrl = transformCloudinaryUrl(cData.secure_url);
  await updateProfile({ profileImage: imageUrl });
  return imageUrl;
}

// getSessions — GET active login sessions for current user
export async function getSessions() {
  const res = await API.get("/api/users/sessions");
  const data = unwrapSuccessData(res);
  return Array.isArray(data) ? data : [];
}

// logoutSession — DELETE one session by id
export async function logoutSession(sessionId) {
  await API.delete(`/api/users/sessions/${sessionId}`);
}

// logoutAllSessions — DELETE all sessions (you are signed out everywhere)
export async function logoutAllSessions() {
  await API.delete("/api/users/sessions");
}

// Re-export helper for consistent error text in UI
export { getApiErrorMessage };
