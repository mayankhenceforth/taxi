import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function BookRide() {
  const [formData, setFormData] = useState({
    pickupLocation: "",
    dropoffLocation: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const navigate = useNavigate();
  const debounceTimeout = useRef(null);

  const API_BASE_URL = "http://localhost:3000/ride";
  const GEOAPIFY_API_KEY = "67b6a05916e446eebf1b33128497a62e"; // Replace with your Geoapify API key

  // Debounce function to limit API calls
  const debounce = (func, wait) => {
    return (...args) => {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => func(...args), wait);
    };
  };

  // Fetch location suggestions from Geoapify
  const fetchSuggestions = debounce(async (input, type) => {
    if (!input) {
      if (type === "pickup") {
        setPickupSuggestions([]);
      } else {
        setDropoffSuggestions([]);
      }
      return;
    }

    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&apiKey=${GEOAPIFY_API_KEY}`
      );
      const suggestions = response.data.features.map((feature) => ({
        description: feature.properties.formatted,
        placeId: feature.properties.place_id,
      }));
      if (type === "pickup") {
        setPickupSuggestions(suggestions);
      } else {
        setDropoffSuggestions(suggestions);
      }
    } catch (err) {
      console.warn("Geoapify API error:", err);
      if (type === "pickup") {
        setPickupSuggestions([]);
      } else {
        setDropoffSuggestions([]);
      }
      let errorMessage = "Failed to fetch location suggestions. Please try again.";
      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = "Invalid Geoapify API key. Please contact support.";
            break;
          case 429:
            errorMessage = "Rate limit exceeded. Please try again later.";
            break;
          case 400:
            errorMessage = "Invalid input for location suggestions.";
            break;
          default:
            errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      setError(errorMessage);
    }
  }, 300);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "pickupLocation") {
      fetchSuggestions(value, "pickup");
    } else if (name === "dropoffLocation") {
      fetchSuggestions(value, "dropoff");
    }
  };

  const handleSuggestionClick = (suggestion, type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: suggestion.description,
    }));
    if (type === "pickupLocation") {
      setPickupSuggestions([]);
    } else {
      setDropoffSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    setCountdown(10);

    // Validate form inputs
    if (!formData.pickupLocation || !formData.dropoffLocation) {
      setError("Please enter both pickup and dropoff locations.");
      setIsLoading(false);
      return;
    }

    // Validate location format
    if (formData.pickupLocation.length < 3 || formData.dropoffLocation.length < 3) {
      setError("Locations must be at least 3 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setError("You must be logged in to book a ride.");
        setIsLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      // Validate token format (basic JWT check)
      if (!accessToken.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
        setError("Invalid authentication token. Please log in again.");
        setIsLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/book`,
        {
          pickupLocation: formData.pickupLocation,
          dropoffLocation: formData.dropoffLocation,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 5000,
        }
      );

      setSuccessMessage(`Ride booked successfully! Redirecting to home in ${countdown} seconds...`);
    } catch (err) {
      let errorMessage = "Failed to book ride. Please try again.";
      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = "Unauthorized. Please log in again.";
            setTimeout(() => navigate("/login"), 2000);
            break;
          case 400:
            errorMessage = err.response.data.message || "Invalid location data.";
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
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        errorMessage = err.message || errorMessage;
      }
      console.error("Booking error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (successMessage && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          const newCountdown = prev - 1;
          if (newCountdown <= 0) {
            navigate("/");
            return 0;
          }
          setSuccessMessage(`Ride booked successfully! Redirecting to home in ${newCountdown} seconds...`);
          return newCountdown;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [successMessage, countdown, navigate]);

  const handleManualRedirect = () => {
    setCountdown(0);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚖 Book a Ride
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {successMessage}
            <button
              onClick={handleManualRedirect}
              className="ml-2 text-sm text-indigo-600 hover:underline"
            >
              Go to Home Now
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-gray-600 text-sm mb-1">
              Pickup Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              placeholder="Enter pickup location"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
              disabled={successMessage}
            />
            {pickupSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-auto">
                {pickupSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.placeId}
                    onClick={() => handleSuggestionClick(suggestion, "pickupLocation")}
                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <label className="block text-gray-600 text-sm mb-1">
              Dropoff Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="dropoffLocation"
              value={formData.dropoffLocation}
              onChange={handleChange}
              placeholder="Enter dropoff location"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
              disabled={successMessage}
            />
            {dropoffSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-auto">
                {dropoffSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.placeId}
                    onClick={() => handleSuggestionClick(suggestion, "dropoffLocation")}
                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || successMessage}
            className={`w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition ${
              isLoading || successMessage ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Booking..." : "Book Ride"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookRide;