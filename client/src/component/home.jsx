import { useState, useEffect } from "react";
import { MapPin, Car, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// Map click component
function LocationSelector({ activeField, onSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (activeField) {
        onSelect(lat, lng, activeField);
      }
    },
  });
  return null;
}

function Home() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [coords, setCoords] = useState({ pickup: null, drop: null });

  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // "pickup" or "drop"

  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);

  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = activeField === "pickup" ? pickup : drop;
      if (query && query.length > 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [pickup, drop, activeField]);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // Handle suggestion click
  const handleSelectSuggestion = (place, type) => {
    if (type === "pickup") setPickup(place.display_name);
    if (type === "drop") setDrop(place.display_name);

    setCoords((prev) => ({
      ...prev,
      [type]: { lat: parseFloat(place.lat), lon: parseFloat(place.lon) },
    }));
    setSuggestions([]);
  };

  // Reverse geocoding for map clicks
  const fetchAddress = async (lat, lon, type) => {
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: { lat, lon, format: "json" },
      });
      const name = res.data.display_name || `${lat}, ${lon}`;
      if (type === "pickup") setPickup(name);
      else setDrop(name);

      setCoords((prev) => ({
        ...prev,
        [type]: { lat, lon },
      }));
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  // Fetch route when pickup + drop set
  useEffect(() => {
    const fetchRoute = async () => {
      if (coords.pickup && coords.drop) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${coords.pickup.lon},${coords.pickup.lat};${coords.drop.lon},${coords.drop.lat}?overview=full&geometries=geojson`;
          const res = await axios.get(url);
          const routeCoords = res.data.routes[0].geometry.coordinates.map(
            (c) => [c[1], c[0]]
          );
          setRoute(routeCoords);
          setDistance((res.data.routes[0].distance / 1000).toFixed(2));
        } catch (error) {
          console.error("Error fetching route:", error);
        }
      }
    };
    fetchRoute();
  }, [coords]);

  const handleMapClick = (lat, lon, field) => {
    fetchAddress(lat, lon, field);
    setActiveField(null); // reset map selection mode
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <h1
          className="text-2xl font-bold text-indigo-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          🚖 RideNow
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-6">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
          Book your ride instantly
        </h2>
        <p className="text-gray-600 mb-6">
          Fast, safe, and affordable rides at your fingertips.
        </p>

        {/* Ride Form */}
        <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-6 space-y-4 relative">
          {/* Pickup */}
          <div className="flex flex-col">
            <div className="flex items-center border rounded-lg p-2">
              <MapPin className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Pickup Location"
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  setActiveField("pickup");
                }}
                className="w-full outline-none"
              />
              <button
                onClick={() => setActiveField("pickup")}
                className={`ml-2 px-2 py-1 text-sm rounded ${
                  activeField === "pickup"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Map
              </button>
            </div>
            {/* Suggestions */}
            {activeField === "pickup" && suggestions.length > 0 && (
              <ul className="absolute z-50 mt-12 bg-white border rounded-lg shadow max-h-48 overflow-y-auto w-[90%]">
                {suggestions.map((place, idx) => (
                  <li
                    key={idx}
                    className="p-2 hover:bg-gray-200 cursor-pointer text-left"
                    onClick={() => handleSelectSuggestion(place, "pickup")}
                  >
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Drop */}
          <div className="flex flex-col">
            <div className="flex items-center border rounded-lg p-2">
              <MapPin className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Drop Location"
                value={drop}
                onChange={(e) => {
                  setDrop(e.target.value);
                  setActiveField("drop");
                }}
                className="w-full outline-none"
              />
              <button
                onClick={() => setActiveField("drop")}
                className={`ml-2 px-2 py-1 text-sm rounded ${
                  activeField === "drop"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Map
              </button>
            </div>
            {/* Suggestions */}
            {activeField === "drop" && suggestions.length > 0 && (
              <ul className="absolute z-50 mt-12 bg-white border rounded-lg shadow max-h-48 overflow-y-auto w-[90%]">
                {suggestions.map((place, idx) => (
                  <li
                    key={idx}
                    className="p-2 hover:bg-gray-200 cursor-pointer text-left"
                    onClick={() => handleSelectSuggestion(place, "drop")}
                  >
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="mt-8 w-full max-w-4xl h-[350px] rounded-lg overflow-hidden shadow-lg relative">
          {distance && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg">
              Best Route Distance: {distance} km
            </div>
          )}

          <MapContainer
            center={[28.6139, 77.209]} // Delhi default
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            {/* Handle clicks */}
            <LocationSelector activeField={activeField} onSelect={handleMapClick} />

            {/* Markers */}
            {coords.pickup && (
              <Marker position={[coords.pickup.lat, coords.pickup.lon]} />
            )}
            {coords.drop && (
              <Marker position={[coords.drop.lat, coords.drop.lon]} />
            )}

            {/* Route */}
            {route.length > 0 && (
              <Polyline positions={route} color="indigo" weight={4} />
            )}
          </MapContainer>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mt-10 max-w-xl w-full">
          <div className="flex flex-col items-center p-4 bg-white rounded-2xl shadow hover:shadow-md cursor-pointer">
            <Car className="text-indigo-600 mb-2" size={32} />
            <p className="font-medium">Ride Now</p>
          </div>
          <div className="flex flex-col items-center p-4 bg-white rounded-2xl shadow hover:shadow-md cursor-pointer">
            <Clock className="text-indigo-600 mb-2" size={32} />
            <p className="font-medium">Schedule Ride</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-indigo-600 text-white text-center py-4">
        <p>© 2025 RideNow — Your travel companion</p>
      </footer>
    </div>
  );
}

export default Home;
