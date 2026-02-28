import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import toast from "react-hot-toast";
import API from "@/api";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { email, password } = formData;

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setErrors({
      ...errors,
      [name]: "",
    });
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
      const role = res.data.user.role;
      toast.success("Login successful");

      if (role === "manager") {
        navigate("/manager/dashboard");
      } else {
        navigate("/employee");
      }

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-white">

      <Header />

      {/* MAIN SECTION */}
      <main className="flex-1 pt-16 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 relative overflow-hidden">

        {/* Subtle Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%)]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-[calc(100vh-4rem)] flex items-center">

          {/* LEFT SIDE */}
          <div className="hidden lg:flex flex-1 text-white pr-20">
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-6">
                Welcome Back
              </h1>

              <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                Sign in to access your dashboard and manage employee shifts
                efficiently and seamlessly.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-full lg:w-[480px] relative">

            {/* Soft glow layer */}
            <div className="absolute -inset-4 bg-white/10 blur-2xl rounded-3xl"></div>

            {/* Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-10">

              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Sign In
              </h2>

              <p className="text-sm text-gray-500 mb-8">
                Enter your credentials to continue
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition
                  ${errors.email
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-500"
                      }`}
                  />

                  {errors.email && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition
                  ${errors.password
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-500"
                      }`}
                  />

                  {errors.password && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input type="checkbox" className="accent-blue-600" />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold 
                hover:scale-[1.02] transition-all duration-200 shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <p className="text-sm text-gray-600 text-center">
                  Don’t have an account?{" "}
                  <Link
                    to="/register"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Create account
                  </Link>
                </p>

              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer clearly separated */}
      <div className="bg-white">
        <Footer />
      </div>

    </div>
  );


}
