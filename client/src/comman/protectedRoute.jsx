import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, requiredRole }) {
  const accessToken = localStorage.getItem("accessToken");
  const location = useLocation();

  // Check if token exists and is a valid JWT format
  if (!accessToken || !accessToken.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
    // Redirect to login, preserving the intended route
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Decode token to check role
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    if (requiredRole && payload.role !== requiredRole) {
      // Redirect to home if role doesn't match
      return <Navigate to="/" replace />;
    }
    return children;
  } catch (err) {
    console.error("Invalid token format:", err);
    // Redirect to login if token decoding fails
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
}

export default ProtectedRoute;