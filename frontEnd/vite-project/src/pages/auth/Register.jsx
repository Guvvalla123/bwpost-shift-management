import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import toast from "react-hot-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!role) {
      newErrors.role = "Please select a role";
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

      await axios.post(
        "http://localhost:5000/api/users/register",
        formData
      );

      toast.success("Account created successfully!");

      setFormData({
        username: "",
        email: "",
        password: "",
        role: "",
      });

      setErrors({});
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed"
      );
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
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition
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

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={role}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 transition
              ${errors.role
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-500"
                      }`}
                  >
                    <option value="">Select role</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                  {errors.role && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.role}
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
