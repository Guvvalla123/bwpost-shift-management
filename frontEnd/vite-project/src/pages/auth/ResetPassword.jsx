// ResetPassword.jsx
// This page lets users set a new password.
// It is opened when user clicks a reset link.
//
// HOW IT WORKS:
// 1. User receives reset link from admin
//    Link looks like: /reset-password?token=XXXXX
// 2. User opens the link in browser
// 3. This page reads the token from the URL
// 4. Token is verified with the server
// 5. If valid the password form is shown
// 6. User enters and confirms new password
// 7. Password is updated in database
// 8. User is redirected to login page
//
// IF TOKEN IS INVALID:
// An error message is shown
// User is told to request a new link
//
// TOKEN SECURITY:
// Tokens expire after 1 hour
// Each token can only be used once
// After use the token is deleted from database

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, XCircle, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "@/api";
import { getApiErrorMessage, unwrapSuccessData } from "@/utils/apiError";
import { cn } from "@/lib/utils";

const fieldInputCls =
  "w-full h-12 pl-10 pr-4 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl " +
  "focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B] focus:bg-white " +
  "transition-all duration-200 placeholder:text-gray-400";

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

// evaluate password rules enforced both client-side and mirrored server-side
function validateNewPassword(p) {
  const errors = {};
  if (!p || p.length < 8) errors.password = "Password must be at least 8 characters";
  else if (!/[A-Z]/.test(p)) errors.password = "Password must contain an uppercase letter";
  else if (!/\d/.test(p)) errors.password = "Password must contain a number";
  else if (!PASSWORD_RULE.test(p)) {
    errors.password = "Password must include a special character (!@#$%^&*)";
  }
  return errors;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Raw token extracted from URL query (?token=)
  const token = searchParams.get("token") || "";

  // "loading" | "valid" | "invalid" — drives which full-page branch renders
  const [validateState, setValidateState] = useState("loading");

  // Password + confirm controlled inputs
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Password field visibility toggles
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // Map of field-specific validation messages surfaced under inputs
  const [fieldErrors, setFieldErrors] = useState({});

  // Spinner while PATCH/POST resetting password executes
  const [submitting, setSubmitting] = useState(false);

  // When true · show success splash with countdown redirect
  const [success, setSuccess] = useState(false);

  // Seconds remaining before programmatic navigation pushes to login
  const [redirectIn, setRedirectIn] = useState(3);

  // Hit validation endpoint GET /reset-password/validate/:token prior to exposing form fields
  const runValidate = useCallback(async () => {
    if (!token || token.length !== 64) {
      setValidateState("invalid");
      return;
    }
    try {
      const res = await API.get(`/api/users/reset-password/validate/${encodeURIComponent(token)}`);
      unwrapSuccessData(res);
      setValidateState("valid");
    } catch {
      setValidateState("invalid");
    }
  }, [token]);

  // Initial mount validates token fingerprint / length constraints
  useEffect(() => {
    runValidate();
  }, [runValidate]);

  // Count-down timer after password saved — auto navigate when hits zero
  useEffect(() => {
    if (!success) return;
    if (redirectIn <= 0) {
      navigate("/login", { replace: true });
      return;
    }
    const t = setTimeout(() => setRedirectIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [success, redirectIn, navigate]);

  // onSubmit — validates pair + POST token + new password combo
  const onSubmit = async (e) => {
    e.preventDefault();
    const err = { ...validateNewPassword(password) };
    if (password !== confirm) err.confirm = "Passwords do not match";
    setFieldErrors(err);
    if (Object.keys(err).length) return;
    setSubmitting(true);
    try {
      await API.post("/api/users/reset-password", { token, password });
      setSuccess(true);
      toast.success("Password updated");
    } catch (er) {
      toast.error(getApiErrorMessage(er, "Could not reset password"));
    } finally {
      setSubmitting(false);
    }
  };

  // Token still being validated with API
  if (validateState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 text-[#1B3F8B] animate-spin" />
      </div>
    );
  }

  // Fatal token problem — malformed or consumed server-side
  if (validateState === "invalid") {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-white">
        <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:p-12">
          <div className="w-full max-w-md mx-auto text-center">
            <p className="text-xl tracking-tight mb-6">
              <span className="font-extrabold text-[#1B3F8B]">BW</span>
              <span className="font-extrabold text-[#1B3F8B] ml-0.5">POST</span>
            </p>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">This link has expired or is invalid</h1>
            <p className="text-sm text-gray-500 mt-3 mb-8">
              Please request a new reset link from your admin or manager.
            </p>
            <Link
              to="/login"
              className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-xl bg-[#1B3F8B] px-6 text-sm font-semibold text-white hover:bg-[#152f6b]"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen · optional manual link while timer runs
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Password reset successful</h1>
          <p className="text-sm text-gray-500 mt-2">You can now log in with your new password.</p>
          <p className="text-xs text-gray-400 mt-2">Redirecting in {redirectIn}s</p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-[#1B3F8B] text-sm font-semibold text-white hover:bg-[#152f6b]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Default branch — validated token ⇒ allow password + confirm submission
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="hidden lg:flex lg:w-[40%] min-h-screen bg-gradient-to-br from-[#0f2042] to-[#1B3F8B] items-center justify-center p-8">
        <p className="text-white text-2xl font-bold tracking-tight">
          <span>BW</span>
          <span className="ml-0.5">POST</span>
        </p>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          <p className="text-xl tracking-tight text-center lg:text-left mb-6">
            <span className="font-extrabold text-[#1B3F8B]">BW</span>
            <span className="font-extrabold text-[#1B3F8B] ml-0.5">POST</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Create new password</h1>
          <p className="text-sm text-gray-500 mt-1 mb-8">Enter your new password below</p>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-pw" className="text-sm font-medium text-gray-700 mb-2 block">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="new-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((o) => ({ ...o, password: "" }));
                  }}
                  autoComplete="new-password"
                  className={cn(
                    fieldInputCls,
                    "pr-11",
                    fieldErrors.password && "border-red-400"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p> : null}
            </div>
            <div>
              <label htmlFor="confirm-pw" className="text-sm font-medium text-gray-700 mb-2 block">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="confirm-pw"
                  type={showPw2 ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setFieldErrors((o) => ({ ...o, confirm: "" }));
                  }}
                  autoComplete="new-password"
                  className={cn(
                    fieldInputCls,
                    "pr-11",
                    fieldErrors.confirm && "border-red-400"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400"
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                >
                  {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirm ? <p className="text-sm text-red-600 mt-1">{fieldErrors.confirm}</p> : null}
            </div>
            <p className="text-xs text-gray-400">Min. 8 characters, uppercase, number, and special (!@#$%^&*)</p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-[#1B3F8B] text-white text-base font-semibold hover:bg-[#152f6b] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#1B3F8B]">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
