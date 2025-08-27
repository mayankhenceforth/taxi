// Route/index.jsx
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../component/home";
import Success from "../component/success";
import Cancel from "../component/cencel";
import Login from "../component/auth/login";
import Signup from "../component/auth/signup";
import ForgotPassword from "../component/auth/forgot.password";

const route = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "payment-success", element: <Success /> },
      { path: "payment-cancel", element: <Cancel /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path:"/forgot", element:<ForgotPassword />}
    ],
  },
]);

export default route;
