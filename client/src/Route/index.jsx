import { createBrowserRouter } from "react-router-dom";

import Home from "../component/home";
import Login from "../component/auth/login";
import Signup from "../component/auth/signup";
import ForgotPassword from "../component/auth/ForgotPassword";
import BookRide from "../component/comman/BookingRide";
import DriverLanding from "../component/driver/DriverLandingPage";
import ProtectedRoute from "../comman/protectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/forgot",
    element: <ForgotPassword />,
  },
  {
    path: "/book-ride",
    element: (
    <ProtectedRoute>
      <BookRide />
    </ProtectedRoute>
        
      
    ),
  },
  {
    path: "/driver",
    element: (
      <ProtectedRoute >
    
    <DriverLanding />

      </ProtectedRoute>
        
    
    ),
  },
]);

export default router;