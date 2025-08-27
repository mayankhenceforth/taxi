import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!contact || !password) {
      alert("Please enter contact number & password!");
      return;
    }
    alert(`Logged in with ${contact} ✅`);
    navigate("/"); // redirect to Home after login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚖 RideNow
        </h1>
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Login to your account
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
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
          <div>
            <label className="block text-gray-600 text-sm mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Login
          </button>
        </form>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <button className="hover:text-indigo-600" onClick={()=>navigate('/forgot')}>Forgot Password?</button>
          <button
            onClick={() => navigate("/signup")}
            className="hover:text-indigo-600"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
