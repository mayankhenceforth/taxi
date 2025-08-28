import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [data, setData] = useState({
    contactNumber: "",
    countryCode: "+91",
    countryCodeList: ["+91", "+1", "+44", "+61"],
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:3000/user";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!data.contactNumber || !data.password) {
      setError("Please enter contact number and password!");
      setIsLoading(false);
      return;
    }

    try {
      const loginData = {
        contactNumber: `${data.countryCode}${data.contactNumber}`,
        password: data.password,
      };

      const response = await axios.post(`${API_BASE_URL}/login`, loginData);
      const { accessToken, refreshToken, data: userData } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setSuccessMessage("Logged in successfully! Redirecting...");
      setTimeout(() => {
        navigate("/book-ride");
      }, 2000);
    } catch (err) {
      let errorMessage = err.response?.data?.message || "An error occurred during login.";
      if (err.response?.status === 401) {
        errorMessage = "Invalid contact number or password.";
      } else if (err.response?.status === 404) {
        errorMessage = "User not found. Please sign up first.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚖 RideNow
        </h1>
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Login to your account
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <select
                name="countryCode"
                value={data.countryCode}
                onChange={handleChange}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {data.countryCodeList.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="contactNumber"
                value={data.contactNumber}
                onChange={handleChange}
                placeholder="Enter your number"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Logging In..." : "Login"}
          </button>
        </form>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <button
            className="hover:text-indigo-600"
            onClick={() => navigate("/forgot")}
          >
            Forgot Password?
          </button>
          <button
            className="hover:text-indigo-600"
            onClick={() => navigate("/signup")}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;