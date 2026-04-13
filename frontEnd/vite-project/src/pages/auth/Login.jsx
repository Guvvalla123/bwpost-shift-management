import React, { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import API from "@/api";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage, unwrapSuccessData } from "@/utils/apiError";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full h-11 rounded-lg border border-slate-200 px-3 text-sm text-[#0f2042] bg-white transition-colors outline-none focus:border-[#1B3F8B] focus:ring-2 focus:ring-[#BFDBFE]/50 placeholder:text-slate-400";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { email, password } = formData;

  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

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
    <div className="min-h-screen relative flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/bwpost_hero.jpg)" }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0f2042]/90 via-[#1B3F8B]/80 to-[#0f2042]/90"
        aria-hidden
      />

      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl shadow-[#0f2042]/40 p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <p className="text-2xl tracking-tight">
            <span className="font-extrabold text-[#1B3F8B]">BW</span>
            <span className="font-light text-slate-400">POST</span>
          </p>
          <p className="text-[10px] font-bold tracking-[3px] text-slate-400 uppercase mt-1">
            SHIFT MANAGEMENT SYSTEM
          </p>
          <div className="w-10 h-0.5 bg-[#1B3F8B] mx-auto mt-4 mb-6 rounded-full" />
        </div>

        <h1 className="font-bold text-[#0f2042] text-xl mb-1 text-center">
          Sign in to your account
        </h1>
        <p className="text-slate-400 text-sm mb-6 text-center">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-1.5 block">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="you@company.com"
              autoComplete="email"
              className={cn(
                inputClass,
                errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500/25"
              )}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  inputClass,
                  "pr-11",
                  errors.password &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/25"
                )}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/50"
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
            className="w-full h-11 bg-[#1B3F8B] hover:bg-[#162d5e] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              "Signing in…"
            ) : (
              <>
                <LogIn className="h-4 w-4" aria-hidden />
                Sign in
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/forgot-password"
            className="text-[#1B3F8B] text-sm font-semibold hover:text-[#162d5e] hover:underline inline-block"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
