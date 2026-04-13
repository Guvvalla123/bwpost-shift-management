/**
 * Returns a display-friendly name from user object.
 * Prefers username; if it looks like an email, extracts the part before @ and capitalizes.
 */
export const getDisplayName = (user, fallback = "User") => {
  if (!user) return fallback;
  const name = user.username || user.email || "";
  if (!name) return fallback;
  // If it looks like an email, use the part before @ (capitalized)
  if (name.includes("@")) {
    const beforeAt = name.split("@")[0];
    return beforeAt ? beforeAt.charAt(0).toUpperCase() + beforeAt.slice(1).toLowerCase() : fallback;
  }
  return name;
};
