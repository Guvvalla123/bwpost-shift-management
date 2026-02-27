import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

// ─── PASTE YOUR GOOGLE OAUTH CLIENT ID HERE ───────────────────────────
// Get it from: https://console.cloud.google.com → APIs & Services → Credentials
const GOOGLE_CLIENT_ID = "24429485718-37luq54f2hu7leta43jpq2o4scjcvpib.apps.googleusercontent.com";
// ────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
