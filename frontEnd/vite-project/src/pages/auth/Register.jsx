import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, UserPlus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import API from "@/api";
import { getApiErrorMessage, getApiFieldErrors, unwrapSuccessData } from "@/utils/apiError";
import { cn } from "@/lib/utils";

const inputBase =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#1B3F8B] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500";

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteValid, setInviteValid] = useState(null);
  const [inviteRole, setInviteRole] = useState(null);
  const navigate = useNavigate();

  const { username, email, password } = formData;

  useEffect(() => {
    if (!inviteToken) {
      setInviteValid(null);
      return;
    }
    setInviteValid(null);
    API.get(`/api/invites/validate/${inviteToken}`)
      .then((res) => {
        const d = unwrapSuccessData(res);
        if (d?.email != null) {
          setInviteValid(true);
          setFormData((prev) => ({ ...prev, email: d.email || "" }));
          setInviteRole(d.role);
        } else setInviteValid(false);
      })
      .catch(() => setInviteValid(false));
  }, [inviteToken]);

  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
      newErrors.password =
        "Must include uppercase, lowercase, number, and special character";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      if (inviteToken) {
        await API.post("/api/invites/accept", { token: inviteToken, username, password });
      } else {
        await API.post("/api/users/register", { username, email, password });
      }
      toast.success("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) {
        setErrors(fieldErrors);
        toast.error(getApiErrorMessage(err, "Please fix the errors below"));
      } else {
        setErrors({});
        toast.error(getApiErrorMessage(err, "Registration failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const showInviteForm = Boolean(inviteToken) && inviteValid === true;
  const inviteLoading = Boolean(inviteToken) && inviteValid === null;
  const inviteInvalid = Boolean(inviteToken) && inviteValid === false;
  const noInvite = !inviteToken;

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Header />

      <main className="relative flex-1 overflow-hidden pt-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_0%,rgb(238_242_255/0.75)_35%,transparent_70%)] dark:bg-[linear-gradient(to_bottom_right,transparent_0%,rgb(49_46_129/0.18)_30%,transparent_65%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-20 h-64 w-[28rem] -translate-x-1/2 rounded-full bg-[#93C5FD]/20 blur-3xl dark:bg-[#1B3F8B]/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/10"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
          {!inviteToken && (
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1B3F8B] dark:text-[#93C5FD]">
                Invite only
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                You need an invite link
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Accounts are created through a secure link from your organization—not from this page
                directly.
              </p>
            </div>
          )}

          {inviteToken && (
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1B3F8B] dark:text-[#93C5FD]">
                You&apos;re invited
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Complete your account
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Choose a username and password to join your team on BWPost Shift Management.
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-900/6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40">
            {noInvite && (
              <>
                <div className="space-y-2 border-b border-slate-100 px-6 pb-4 pt-6 text-center sm:text-left dark:border-slate-800">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-indigo-950/60 sm:mx-0">
                    <Mail className="h-6 w-6 text-[#1B3F8B] dark:text-[#93C5FD]" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    No invite token found
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Ask your HR or administrator to send you an onboarding link. When you open it,
                    you&apos;ll return here with your email pre-filled.
                  </p>
                </div>
                <div className="border-t border-slate-100 px-6 py-6 dark:border-slate-800">
                  <Link
                    to="/login"
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#1B3F8B] text-sm font-medium text-white shadow-md shadow-[#1B3F8B]/20 transition hover:bg-[#162d5e]"
                  >
                    Back to sign in
                  </Link>
                </div>
              </>
            )}

            {!noInvite && (
              <>
                <div className="space-y-1 border-b border-slate-100 px-6 pb-4 pt-6 text-center sm:text-left dark:border-slate-800">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    Accept invite
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {inviteInvalid ? (
                      "This invite link is not valid."
                    ) : inviteLoading ? (
                      <span className="inline-flex items-center justify-center gap-2 sm:justify-start">
                        <Loader2 className="h-4 w-4 animate-spin text-[#1B3F8B] dark:text-[#93C5FD]" aria-hidden />
                        Validating your invite…
                      </span>
                    ) : (
                      <>
                        You&apos;re joining as{" "}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {inviteRole || "employee"}
                        </span>
                        . Set your username and password below.
                      </>
                    )}
                  </p>
                </div>
                <div className="px-6 py-6">
                  {inviteInvalid && (
                    <div
                      role="alert"
                      className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      This invite is invalid or has expired. Request a new link from your
                      administrator.
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    style={{ display: inviteInvalid ? "none" : undefined }}
                  >
                    <div className="space-y-2">
                      <label htmlFor="register-username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Username
                      </label>
                      <input
                        id="register-username"
                        type="text"
                        name="username"
                        value={username}
                        onChange={handleChange}
                        placeholder="jane.smith"
                        autoComplete="username"
                        disabled={!showInviteForm}
                        className={cn(
                          inputBase,
                          !showInviteForm && "opacity-60",
                          errors.username &&
                            "border-red-500 focus:border-red-500 focus:ring-red-500/25 dark:border-red-500"
                        )}
                        aria-invalid={!!errors.username}
                      />
                      {errors.username && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Email
                      </label>
                      <input
                        id="register-email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        readOnly={!!inviteToken}
                        autoComplete="email"
                        disabled={!showInviteForm}
                        className={cn(
                          inputBase,
                          !showInviteForm && "opacity-60",
                          inviteToken && "cursor-not-allowed bg-slate-100 dark:bg-slate-800/80",
                          errors.email &&
                            "border-red-500 focus:border-red-500 focus:ring-red-500/25 dark:border-red-500"
                        )}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="register-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={password}
                          onChange={handleChange}
                          placeholder="8+ chars, mixed case, number, symbol"
                          autoComplete="new-password"
                          disabled={!showInviteForm}
                          className={cn(
                            inputBase,
                            "pr-11",
                            !showInviteForm && "opacity-60",
                            errors.password &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500/25 dark:border-red-500"
                          )}
                          aria-invalid={!!errors.password}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          disabled={!showInviteForm}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !showInviteForm}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1B3F8B] text-base font-medium text-white shadow-md shadow-[#1B3F8B]/20 transition hover:bg-[#162d5e] disabled:pointer-events-none disabled:opacity-50 dark:shadow-slate-900/40"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Creating account…
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" aria-hidden />
                          Complete signup
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-medium text-[#1B3F8B] hover:text-[#2563EB] dark:text-[#93C5FD]"
                      >
                        Sign in
                      </Link>
                    </p>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <div className="border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <Footer />
      </div>
    </div>
  );
};

export default Register;
