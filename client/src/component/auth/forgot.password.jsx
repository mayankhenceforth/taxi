import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = contact, 2 = OTP, 3 = reset
  const [contact, setContact] = useState("9876543210"); // ✅ default contact number
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚖 RideNow
        </h1>

        {/* Step 1: Contact Number */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
              Forgot Password?
            </h2>
            <p className="text-center text-gray-600 text-sm mb-6">
              Enter your contact number to receive an OTP.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter your number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Send OTP
              </button>
            </div>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
              Verify OTP
            </h2>
            <p className="text-center text-gray-600 text-sm mb-6">
              OTP sent to <span className="font-medium">{contact}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">OTP</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-widest"
                />
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Verify OTP
              </button>
            </div>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
              Reset Password
            </h2>
            <p className="text-center text-gray-600 text-sm mb-6">
              Reset password for <span className="font-medium">{contact}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Reset Password
              </button>
            </div>
          </>
        )}

        {/* Back to Login */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:underline"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
