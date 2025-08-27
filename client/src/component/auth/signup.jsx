import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [data, setData] = useState({
    name: "",
    contactNumber: "",
    email: "",
    password: "",
    re_password: "",
    role: "user",

    vehicleDetails: {
      numberPlate: "",
      type: "car",
      model: "",
    },
    driverLicense: {
      licenseNumber: "",
      issueDate: "",
      expiryDate: "",
      issuingAuthority: "",
    },
  });

  const navigate = useNavigate();

  const handleChange = (e, parent) => {
    const { name, value } = e.target;

    if (parent) {
      setData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [name]: value,
        },
      }));
    } else {
      setData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!data.name || !data.contactNumber || !data.password || !data.re_password) {
      alert("Please fill all required fields!");
      return;
    }
    if (data.password !== data.re_password) {
      alert("Passwords do not match!");
      return;
    }
    if (data.role === "driver") {
      if (!data.vehicleDetails.numberPlate || !data.driverLicense.licenseNumber) {
        alert("Driver must provide vehicle and license details!");
        return;
      }
    }

    console.log("Signup Data:", data);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚖 RideNow - Sign Up
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={data.contactNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-gray-600 text-sm mb-1">Email (Optional)</label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Re-enter Password */}
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="re_password"
              value={data.re_password}
              onChange={handleChange}
              placeholder="Re-enter password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-600 text-sm mb-1">Role</label>
            <select
              name="role"
              value={data.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="user">User</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          {/* Driver Specific Section */}
          {data.role === "driver" && (
            <div className="space-y-6 border-t pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-700">🚘 Vehicle Details</h2>

              <div>
                <label className="block text-gray-600 text-sm mb-1">
                  Number Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="numberPlate"
                  value={data.vehicleDetails.numberPlate}
                  onChange={(e) => handleChange(e, "vehicleDetails")}
                  placeholder="e.g. KA01AB1234"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Vehicle Type</label>
                <select
                  name="type"
                  value={data.vehicleDetails.type}
                  onChange={(e) => handleChange(e, "vehicleDetails")}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={data.vehicleDetails.model}
                  onChange={(e) => handleChange(e, "vehicleDetails")}
                  placeholder="Vehicle Model"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <h2 className="text-lg font-semibold text-gray-700 mt-6">🪪 License Details</h2>

              <div>
                <label className="block text-gray-600 text-sm mb-1">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={data.driverLicense.licenseNumber}
                  onChange={(e) => handleChange(e, "driverLicense")}
                  placeholder="DL1234567"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Issue Date</label>
                <input
                  type="date"
                  name="issueDate"
                  value={data.driverLicense.issueDate}
                  onChange={(e) => handleChange(e, "driverLicense")}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={data.driverLicense.expiryDate}
                  onChange={(e) => handleChange(e, "driverLicense")}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Issuing Authority</label>
                <input
                  type="text"
                  name="issuingAuthority"
                  value={data.driverLicense.issuingAuthority}
                  onChange={(e) => handleChange(e, "driverLicense")}
                  placeholder="RTO Bangalore"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Sign Up
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{" "}
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

export default Signup;
