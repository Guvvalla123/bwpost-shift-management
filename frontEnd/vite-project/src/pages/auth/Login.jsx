// Login.jsx
// This is the login page for BWPost.
// User enters email and password to login.
//
// HOW LOGIN WORKS:
// 1. User fills in email and password
// 2. Form is validated before submitting
// 3. POST request sent to /api/users/login
// 4. If correct server sets JWT cookies
// 5. User is redirected to their dashboard
//    based on their role (admin/manager/employee)
//
// WHY WE USE COOKIES:
// The server stores JWT tokens in HTTP-only cookies.
// HTTP-only means JavaScript cannot read them.
// This prevents XSS attacks.
// The browser sends cookies automatically.

import React, { useState } from "react";
import { Eye, EyeOff, LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage, unwrapSuccessData } from "@/utils/apiError";
import { cn } from "@/lib/utils";

const fieldInputCls =
  "w-full h-12 pl-10 pr-4 text-base md:text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl " +
  "focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20 focus:border-[#1B3F8B] focus:bg-white " +
  "transition-all duration-200 placeholder:text-gray-400";

export default function Login() {
  // Email + password keyed form object (controlled inputs)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Field-level validation errors keyed by input name (empty strings when valid)
  const [errors, setErrors] = useState({});

  // True during async login POST to disable button and show spinner
  const [loading, setLoading] = useState(false);

  // Toggles masking of the password field in the DOM
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { email, password } = formData;

  // Lightweight email sanity check reused by validateForm before submit
  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Controlled input wiring — updates state and clears stale field error live
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // Returns an object describing client-side violations (empty ⇒ valid)
  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  // Main submit pipeline: validate → authenticate → hydrate auth context → route by role
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/api/users/login", formData);
      const loginPayload = unwrapSuccessData(res);
      const loggedInUser = loginPayload?.user ?? loginPayload;
      const { role } = loggedInUser;

      try {
        const meRes = await API.get("/api/users/me");
        const me = unwrapSuccessData(meRes);
        login(me);
      } catch {
        login(loggedInUser);
      }

      toast.success("Login successful");

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "manager") {
        navigate("/manager/dashboard");
      } else {
        navigate("/employee");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="hidden lg:flex lg:w-[60%] min-h-screen relative flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0f2042] via-[#152a52] to-[#1B3F8B]">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full border border-white" />
          <div className="absolute bottom-32 left-10 w-64 h-64 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rotate-12 border border-white rounded-lg" />
        </div>
        <div className="relative z-10 px-12 xl:px-16 py-14 flex flex-col justify-center flex-1 max-w-2xl">
          <div className="mb-10">
            <span className="text-white font-bold text-2xl tracking-tight">BW</span>
            <span className="text-white/90 font-bold text-2xl tracking-tight ml-0.5">POST</span>
          </div>
          <h2 className="text-white text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
            Empowering Germany&apos;s
            <br />
            Delivery Workforce
          </h2>
          <p className="mt-5 text-white/70 text-base leading-relaxed max-w-md">
            Shift management built for 2,200+ delivery professionals
          </p>
          <ul className="mt-10 space-y-5 text-white/90 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
              Smart Shift Scheduling
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
              Real-time Attendance Tracking
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
              Seamless Team Coordination
            </li>
          </ul>
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
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mt-2">
              SHIFT MANAGEMENT SYSTEM
            </p>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1 mb-8">Sign in to your account</p>

          {/* POST /api/users/login with validated credentials */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="text-sm font-medium text-gray-700 mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoFocus
                  className={cn(
                    fieldInputCls,
                    errors.email && "border-red-400 focus:border-red-500 focus:ring-red-200"
                  )}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm font-medium text-gray-700 mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={cn(
                    fieldInputCls,
                    "pr-11",
                    errors.password && "border-red-400 focus:border-red-500 focus:ring-red-200"
                  )}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1B3F8B]/20"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#1B3F8B] text-white text-sm font-semibold hover:bg-[#152f6b] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-[#1B3F8B]/25 flex items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" aria-hidden />
                  Sign in
                </>
              )}
            </button>
          </form>

          <Link
            to="/forgot-password"
            className="text-sm text-[#1B3F8B] font-medium hover:underline text-center block py-3 mt-2"
          >
            Forgot password?
          </Link>

          <div className="hidden lg:block mt-10 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">Secure login powered by BWPost</p>
          </div>
        </div>
      </div>
    </div>
  );
}
