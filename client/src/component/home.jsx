import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  // Check user role from token
  const getRole = () => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        return payload.role; // 'user' or 'driver'
      } catch {
        return null;
      }
    }
    return null;
  };

  const role = getRole();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">🚖 Welcome to RideNow</h1>
        <p className="text-lg text-gray-600 mb-8">Your trusted ride-sharing platform</p>

        {role === "driver" ? (
          <button
            onClick={() => navigate("/driver")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Go to Driver Dashboard
          </button>
        ) : role === "user" ? (
          <button
            onClick={() => navigate("/book-ride")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Book a Ride
          </button>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition mr-4"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Signup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;