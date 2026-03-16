import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import API from "@/api";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, role } = formData;

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
      newErrors.password = "Must include uppercase, lowercase, number, and special character";
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
      await API.post("/api/users/register", formData);
      toast.success("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const fieldErrors = {};
        data.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
        toast.error(data.message || "Please fix the errors below");
      } else {
        setErrors({});
        toast.error(data?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      <Header />
      <main className="flex-1 pt-16">

        <div className="min-h-[calc(100vh-4rem)] flex bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 relative overflow-hidden">

          {/* LEFT CONTENT */}
          <div className="hidden lg:flex flex-1 items-center px-24">

            <div className="max-w-xl text-white">
              <h1 className="text-6xl font-bold leading-tight mb-8">
                Shift Management <br /> System
              </h1>

              <p className="text-xl text-blue-100 leading-relaxed">
                Manage employee schedules, track shifts, and streamline
                operations — all in one powerful enterprise dashboard.
              </p>
            </div>

          </div>

          {/* RIGHT FLOATING FORM */}
          <div className="relative flex items-center pr-16">

            <div className="bg-white w-[460px] rounded-3xl shadow-2xl p-10 my-16">

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create Account
              </h2>

              <p className="text-gray-500 text-sm mb-8">
                Get started by creating your account
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition
              ${errors.username
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-500"
                      }`}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Register as
                  </label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition
                      ${role === "employee" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        name="role"
                        value="employee"
                        checked={role === "employee"}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="font-medium">Employee</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition
                      ${role === "manager" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        name="role"
                        value="manager"
                        checked={role === "manager"}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="font-medium">Manager</span>
                    </label>
                  </div>
                </div>

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
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className={`w-full px-4 py-3 pr-11 rounded-xl border focus:outline-none focus:ring-2 transition
                ${errors.password
                          ? "border-red-500 focus:ring-red-400"
                          : "border-gray-300 focus:ring-blue-500"
                        }`}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold 
            hover:shadow-lg hover:scale-[1.02] transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Register"}
                </button>

                <p className="text-sm text-gray-600 text-center pt-2">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>

              </form>

            </div>

          </div>

        </div>

      </main>


      <Footer />

    </div>
  );
};

export default Register;
