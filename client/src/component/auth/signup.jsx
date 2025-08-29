import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UserDetails({ data, errors, handleChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Personal Details</h2>
      <div>
        <label htmlFor="name" className="block text-gray-600 text-sm mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={data.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
            errors.name ? "border-red-500" : ""
          }`}
          aria-required="true"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="contactNumber" className="block text-gray-600 text-sm mb-1">
          Contact Number <span className="text-red-500">*</span>
        </label>
        <input
          id="contactNumber"
          type="tel"
          name="contactNumber"
          value={data.contactNumber}
          onChange={handleChange}
          placeholder="Enter your phone number"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
            errors.contactNumber ? "border-red-500" : ""
          }`}
          aria-required="true"
        />
        {errors.contactNumber && <p className="text-red-500 text-sm mt-1">{errors.contactNumber}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-gray-600 text-sm mb-1">
          Email (Optional)
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          placeholder="Enter your email"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-gray-600 text-sm mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={data.password}
          onChange={handleChange}
          placeholder="Enter password"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
            errors.password ? "border-red-500" : ""
          }`}
          aria-required="true"
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="re_password" className="block text-gray-600 text-sm mb-1">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <input
          id="re_password"
          type="password"
          name="re_password"
          value={data.re_password}
          onChange={handleChange}
          placeholder="Re-enter password"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
            errors.re_password ? "border-red-500" : ""
          }`}
          aria-required="true"
        />
        {errors.re_password && <p className="text-red-500 text-sm mt-1">{errors.re_password}</p>}
      </div>

      <div>
        <label htmlFor="role" className="block text-gray-600 text-sm mb-1">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={data.role}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="user">User</option>
          <option value="driver">Driver</option>
        </select>
      </div>
    </div>
  );
}

function VehicleDetails({ vehicleDetails, errors, handleChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">🚘 Vehicle Details</h2>
      <div>
        <label htmlFor="numberPlate" className="block text-gray-600 text-sm mb-1">
          Number Plate <span className="text-red-500">*</span>
        </label>
        <input
          id="numberPlate"
          type="text"
          name="numberPlate"
          value={vehicleDetails.numberPlate}
          onChange={(e) => handleChange(e, "vehicleDetails")}
          placeholder="e.g. KA01AB1234"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
            errors.numberPlate ? "border-red-500" : ""
          }`}
          aria-required="true"
        />
        {errors.numberPlate && <p className="text-red-500 text-sm mt-1">{errors.numberPlate}</p>}
      </div>

      <div>
        <label htmlFor="type" className="block text-gray-600 text-sm mb-1">
          Vehicle Type
        </label>
        <select
          id="type"
          name="type"
          value={vehicleDetails.type}
          onChange={(e) => handleChange(e, "vehicleDetails")}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="car">Car</option>
          <option value="bike">Bike</option>
        </select>
      </div>

      <div>
        <label htmlFor="model" className="block text-gray-600 text-sm mb-1">
          Model
        </label>
        <input
          id="model"
          type="text"
          name="model"
          value={vehicleDetails.model}
          onChange={(e) => handleChange(e, "vehicleDetails")}
          placeholder="Vehicle Model"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
}

function LicenseDetails({ driverLicense, errors, handleChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">🪪 License Details</h2>
      <div>
        <label htmlFor="licenseNumber" className="block text-gray-600 text-sm mb-1">
          License Number <span className="text-red-500">*</span>
        </label>
        <input
          id="licenseNumber"
          type="text"
          name="licenseNumber"
          value={driverLicense.licenseNumber}
          onChange={(e) => handleChange(e, "driverLicense")}
          placeholder="DL1234567"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
            errors.licenseNumber ? "border-red-500" : ""
          }`}
          aria-required="true"
        />
        {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
      </div>

      <div>
        <label htmlFor="issueDate" className="block text-gray-600 text-sm mb-1">
          Issue Date
        </label>
        <input
          id="issueDate"
          type="date"
          name="issueDate"
          value={driverLicense.issueDate}
          onChange={(e) => handleChange(e, "driverLicense")}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label htmlFor="expiryDate" className="block text-gray-600 text-sm mb-1">
          Expiry Date
        </label>
        <input
          id="expiryDate"
          type="date"
          name="expiryDate"
          value={driverLicense.expiryDate}
          onChange={(e) => handleChange(e, "driverLicense")}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
            errors.expiryDate ? "border-red-500" : ""
          }`}
        />
        {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
      </div>

      <div>
        <label htmlFor="issuingAuthority" className="block text-gray-600 text-sm mb-1">
          Issuing Authority
        </label>
        <input
          id="issuingAuthority"
          type="text"
          name="issuingAuthority"
          value={driverLicense.issuingAuthority}
          onChange={(e) => handleChange(e, "driverLicense")}
          placeholder="RTO Bangalore"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
}

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

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    let newErrors = {};

    // Basic field validations
    if (!data.name) newErrors.name = "Full name is required";
    if (!data.contactNumber) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^[0-9]{10}$/.test(data.contactNumber)) {
      newErrors.contactNumber = "Enter a valid 10-digit phone number";
    }
    if (!data.password) newErrors.password = "Password is required";
    if (!data.re_password) newErrors.re_password = "Please confirm your password";
    if (data.password && data.re_password && data.password !== data.re_password) {
      newErrors.re_password = "Passwords do not match";
    }
    if (data.password && data.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    // Driver-specific validations
    if (data.role === "driver") {
      if (!data.vehicleDetails.numberPlate) {
        newErrors.numberPlate = "Number plate is required";
      }
      if (!data.driverLicense.licenseNumber) {
        newErrors.licenseNumber = "License number is required";
      }
      if (data.driverLicense.issueDate && data.driverLicense.expiryDate) {
        const issue = new Date(data.driverLicense.issueDate);
        const expiry = new Date(data.driverLicense.expiryDate);
        if (issue >= expiry) {
          newErrors.expiryDate = "Expiry date must be after issue date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

    // Clear error for the field being edited
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulated API call (replace with actual API endpoint)
      const response = await fetch("https://api.ridenow.com/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        navigate("/login");
      } else {
        setErrors({ form: "Signup failed. Please try again." });
      }
    } catch (error) {
      setErrors({ form: "An error occurred. Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setData({
      name: "",
      contactNumber: "",
      email: "",
      password: "",
      re_password: "",
      role: "user",
      vehicleDetails: { numberPlate: "", type: "car", model: "" },
      driverLicense: { licenseNumber: "", issueDate: "", expiryDate: "", issuingAuthority: "" },
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚖 RideNow - Sign Up
        </h1>

        {errors.form && (
          <div className="text-red-500 text-sm text-center mb-4">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <UserDetails data={data} errors={errors} handleChange={handleChange} />

          {data.role === "driver" && (
            <div className="space-y-6 border-t pt-6 mt-6">
              <VehicleDetails
                vehicleDetails={data.vehicleDetails}
                errors={errors}
                handleChange={handleChange}
              />
              <LicenseDetails
                driverLicense={data.driverLicense}
                errors={errors}
                handleChange={handleChange}
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Reset
            </button>
          </div>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:underline"
            aria-label="Navigate to login page"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;