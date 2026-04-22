import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, CheckCircle, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "@/api";
import { getApiErrorMessage, unwrapSuccessData } from "@/utils/apiError";
import { cn } from "@/lib/utils";

const fieldInputCls =
  "w-full h-12 pl-10 pr-4 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl " +
  "focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B] focus:bg-white " +
  "transition-all duration-200 placeholder:text-gray-400";

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("aria-hidden", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResultData(null);
    const trimmed = email.trim();
    if (!isValidEmailFormat(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/api/users/forgot-password", { email: trimmed });
      const data = unwrapSuccessData(res);
      setDone(true);
      setResultData(data || null);
    } catch (err) {
      const code = err?.response?.status;
      if (code === 429) {
        setError("Too many reset attempts. Please try again in 15 minutes.");
      } else {
        setError(getApiErrorMessage(err, "Request failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!resultData?.resetLink) return;
    const ok = await copyToClipboard(resultData.resetLink);
    if (ok) toast.success("Link copied to clipboard");
    else toast.error("Could not copy. Select and copy the link manually.");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="hidden lg:flex lg:w-[60%] min-h-screen relative flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0f2042] via-[#152a52] to-[#1B3F8B]">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full border border-white" />
        </div>
        <div className="relative z-10 px-12 xl:px-16 py-14 flex flex-col justify-center flex-1 max-w-2xl">
          <div className="mb-10">
            <span className="text-white font-bold text-2xl tracking-tight">BW</span>
            <span className="text-white/90 font-bold text-2xl tracking-tight ml-0.5">POST</span>
          </div>
          <h2 className="text-white text-3xl xl:text-4xl font-bold leading-tight tracking-tight">Shift management for your team</h2>
        </div>
        <div className="relative z-10 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" aria-hidden />
      </div>

      <div className="flex-1 w-full lg:w-[40%] flex flex-col justify-center px-6 py-10 sm:p-8 lg:p-12 min-h-screen bg-white">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 text-center lg:text-left">
            <p className="text-xl tracking-tight">
              <span className="font-extrabold text-[#1B3F8B]">BW</span>
              <span className="font-extrabold text-[#1B3F8B] ml-0.5">POST</span>
            </p>
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mt-2">SHIFT MANAGEMENT SYSTEM</p>
          </div>

          {!done ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="text-sm text-gray-500 mt-1 mb-8">
                Enter your email address and we will generate a reset link for you
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="forgot-email" className="text-sm font-medium text-gray-700 mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="your@bwpost.de"
                      autoComplete="email"
                      autoFocus
                      className={cn(fieldInputCls, error && "border-red-400 focus:border-red-500 focus:ring-red-200")}
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#1B3F8B] text-white text-base font-semibold hover:bg-[#152f6b] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-[#1B3F8B]/25 flex items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Generate Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Reset link generated</h2>
              {resultData?.resetLink ? (
                <div className="text-left space-y-3">
                  <p className="text-sm text-gray-600">
                    Copy the link below. It expires on{" "}
                    {resultData.expiresAt
                      ? new Date(resultData.expiresAt).toLocaleString()
                      : "the time shown in your app settings."}
                  </p>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={resultData.resetLink}
                      className="flex-1 min-w-0 h-11 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="h-11 px-4 rounded-xl bg-[#1B3F8B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#152f6b]"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  Contact your admin or manager to get your password reset link. They can generate it from the admin or
                  manager dashboard.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#1B3F8B] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function isValidEmailFormat(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
