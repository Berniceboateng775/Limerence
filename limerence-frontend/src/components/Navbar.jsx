import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/home", label: "Home", icon: "🏠" },
    { path: "/myshelf", label: "My Shelf", icon: "📚" },
    { path: "/clubs", label: "Clubs", icon: "🥂" }, // Replaced Social with Clubs
    { path: "/moods", label: "Moods", icon: "✨" },
    { path: "/profile", label: "Profile", icon: "👤" },
  ];

  const handleLogout = () => {
    logout();
    // Force hard redirect to ensure state is cleared and user is moved
    window.location.href = "/login"; 
  };

  return (
    <nav className="fixed bottom-0 md:bottom-auto md:top-0 w-full bg-white/80 backdrop-blur-md border-t md:border-b border-white/20 z-50 shadow-lg md:shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo (Hidden on mobile) */}
          <Link to="/home" className="hidden md:block text-2xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
            Limerence
          </Link>

          {/* Links */}
          <div className="flex w-full md:w-auto justify-around md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col md:flex-row items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
                  isActive(link.path)
                    ? "text-purple-600 bg-purple-50 md:bg-transparent font-bold"
                    : "text-gray-500 hover:text-purple-400"
                }`}
              >
                <span className="text-xl md:text-lg">{link.icon}</span>
                <span className="text-xs md:text-base">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Logout (Desktop only) */}
          <button
            onClick={handleLogout}
            className="hidden md:block px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
