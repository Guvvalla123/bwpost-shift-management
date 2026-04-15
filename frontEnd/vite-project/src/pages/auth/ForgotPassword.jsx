import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center px-4 sm:px-0 py-8 pb-20 lg:pb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md mx-auto text-center">

        <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-[#1B3F8B]" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Forgot Password?
        </h1>

        <p className="text-slate-500 mb-6 leading-relaxed text-sm">
          Password reset via email is not yet
          available. Please contact your HR
          administrator or manager to reset
          your password.
        </p>

        <div className="bg-[#EFF6FF] rounded-xl p-4 mb-6 text-left border border-[#BFDBFE]">
          <p className="text-sm font-semibold text-[#1B3F8B] mb-1">
            Need help?
          </p>
          <p className="text-sm text-[#1B3F8B]/90">
            Contact your HR department or
            system administrator to request
            a password reset.
          </p>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 w-full min-h-12 text-base font-semibold rounded-xl bg-[#1B3F8B] text-white hover:bg-[#162d5e] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
