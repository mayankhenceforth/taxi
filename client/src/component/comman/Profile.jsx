function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🚖 Profile
        </h1>
        <div className="space-y-4">
          <p className="text-gray-600">
            <strong>Name:</strong> {user.name || "N/A"}
          </p>
          <p className="text-gray-600">
            <strong>Contact:</strong> {user.contactNumber || "N/A"}
          </p>
          <p className="text-gray-600">
            <strong>Role:</strong> {user.role || "N/A"}
          </p>
          {user.role === "driver" && (
            <>
              <p className="text-gray-600">
                <strong>Vehicle Number Plate:</strong> {user.vehicleDetails?.numberPlate || "N/A"}
              </p>
              <p className="text-gray-600">
                <strong>Vehicle Type:</strong> {user.vehicleDetails?.type || "N/A"}
              </p>
              <p className="text-gray-600">
                <strong>Vehicle Model:</strong> {user.vehicleDetails?.model || "N/A"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;