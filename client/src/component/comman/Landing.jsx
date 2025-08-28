import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setIsAuthenticated(!!accessToken);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/book-ride");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-indigo-600 mb-4">🚖 RideNow</h1>
        <p className="text-xl text-gray-600 mb-6 max-w-md mx-auto">
          Book your ride in seconds. Fast, reliable, and affordable transportation
          at your fingertips.
        </p>
        <button
          onClick={handleGetStarted}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          {isAuthenticated ? "Book a Ride" : "Get Started"}
        </button>
      </div>
    </div>
  );
}

export default Landing;