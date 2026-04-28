// ActiveSessions.jsx
// Shows the active login sessions section in the settings page.
// Uses the existing ActiveSessionsSection component which manages
// its own state and API calls for listing and ending sessions.
// Wrapping it here keeps the settings page file structure clean.

import React from "react";
import ActiveSessionsSection from "@/components/security/ActiveSessionsSection";

// ActiveSessions - wrapper for the existing sessions management component
//
// The ActiveSessionsSection component handles all session logic internally:
// - Fetches the list of active sessions
// - Allows manager to end individual sessions
// - Allows manager to end all sessions at once
// No props needed — it manages its own state.
const ActiveSessions = () => {
  return <ActiveSessionsSection />;
};

export default ActiveSessions;
