import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";

function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setIsAuthenticated(!!accessToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <NavLink to="/" className="text-2xl font-bold text-indigo-600">
              🚖 RideNow
            </NavLink>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? "text-indigo-600 border-b-2 border-indigo-600" : ""
                }`
              }
            >
              Home
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive ? "text-indigo-600 border-b-2 border-indigo-600" : ""
                    }`
                  }
                >
                  Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive ? "text-indigo-600 border-b-2 border-indigo-600" : ""
                    }`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive ? "text-indigo-600 border-b-2 border-indigo-600" : ""
                    }`
                  }
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-indigo-600 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium transition ${
                    isActive ? "text-indigo-600 bg-indigo-50" : ""
                  }`
                }
                onClick={toggleMenu}
              >
                Home
              </NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `block text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium transition ${
                        isActive ? "text-indigo-600 bg-indigo-50" : ""
                      }`
                    }
                    onClick={toggleMenu}
                  >
                    Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="block w-full text-left text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `block text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium transition ${
                        isActive ? "text-indigo-600 bg-indigo-50" : ""
                      }`
                    }
                    onClick={toggleMenu}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className={({ isActive }) =>
                      `block text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium transition ${
                        isActive ? "text-indigo-600 bg-indigo-50" : ""
                      }`
                    }
                    onClick={toggleMenu}
                  >
                    Sign Up
                  </NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Nav;