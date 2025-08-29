import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function DriverLanding() {
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:3000/ride";

  // Fetch available rides
  useEffect(() => {
    const fetchRides = async () => {
      setIsLoading(true);
      setError("");
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          setError("You must be logged in as a driver.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // Basic JWT validation
        if (
          !accessToken.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
        ) {
          setError("Invalid authentication token. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // Decode token to check role
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        if (payload.role !== "driver") {
          setError("Access denied. Driver role required.");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/available`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        });
        setRides(response.data);
      } catch (err) {
        let errorMessage = "Failed to fetch rides. Please try again.";
        if (err.response) {
          switch (err.response.status) {
            case 401:
              errorMessage = "Unauthorized. Please log in again.";
              setTimeout(() => navigate("/login"), 2000);
              break;
            case 403:
              errorMessage = "Access denied. Driver role required.";
              setTimeout(() => navigate("/"), 2000);
              break;
            case 429:
              errorMessage = "Too many requests. Please try again later.";
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            default:
              errorMessage = err.response.data.message || errorMessage;
          }
        } else if (err.request) {
          errorMessage =
            "Network error. Please check your internet connection.";
        }
        console.error("Fetch rides error:", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRides();
  }, [navigate]);

  const handleAcceptRide = async (rideId) => {
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_BASE_URL}/accept/${rideId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        }
      );
      setSuccessMessage("Ride accepted successfully!");
      // Remove accepted ride from list
      setRides((prev) => prev.filter((ride) => ride._id !== rideId));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      let errorMessage = "Failed to accept ride. Please try again.";
      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = "Unauthorized. Please log in again.";
            setTimeout(() => navigate("/login"), 2000);
            break;
          case 400:
            errorMessage = err.response.data.message || "Invalid ride request.";
            break;
          case 404:
            errorMessage = "Ride not found or already accepted.";
            break;
          case 429:
            errorMessage = "Too many requests. Please try again later.";
            break;
          default:
            errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      console.error("Accept ride error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚗 Driver Dashboard
        </h1>

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

        {isLoading ? (
          <div className="text-center text-gray-600">Loading rides...</div>
        ) : rides.length === 0 ? (
          <div className="text-center text-gray-600">
            No available rides at the moment.
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride._id} className="border rounded-lg p-4 bg-gray-50">
                <p className="text-gray-700">
                  <span className="font-semibold">Pickup:</span>{" "}
                  {ride.pickupLocation}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Dropoff:</span>{" "}
                  {ride.dropoffLocation}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">User ID:</span> {ride.userId}
                </p>
                <button
                  onClick={() => handleAcceptRide(ride._id)}
                  disabled={isLoading}
                  className={`mt-2 w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Accept Ride
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverLanding;
