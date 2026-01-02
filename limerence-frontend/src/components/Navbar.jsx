import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/home", label: "Home", icon: "🏠" },
    { path: "/myshelf", label: "Library", icon: "📚" },
    { path: "/clubs", label: "Clubs", icon: "💬" },
    { path: "/badges", label: "Badges", icon: "🎖️" }, 
    { path: "/moods", label: "Moods", icon: "🔥" },
    { path: "/profile", label: "Me", icon: "👤" },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/login"; 
  };

  return (
    <nav className="fixed bottom-0 md:bottom-auto md:top-0 w-full bg-white dark:bg-slate-800 border-t md:border-b border-gray-200 dark:border-slate-700 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/home" className="hidden md:block text-2xl font-bold text-primary tracking-tight">
            Limerence
          </Link>

          {/* Links */}
          <div className="flex w-full md:w-auto justify-around md:gap-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col md:flex-row items-center gap-1 p-2 md:p-0 transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-primary font-bold border-t-2 border-primary md:border-t-0 md:border-b-2" 
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span className="text-xl md:text-lg mb-1 md:mb-0 md:mr-2">{link.icon}</span>
                <span className="text-xs md:text-sm hidden md:inline">{link.label}</span>
              </Link>
            ))}
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <span className="text-xl">{theme === 'light' ? '🌙' : '☀️'}</span>
            </button>
            
            {/* Notification Bell */}
             <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition">
                <span className="text-xl">🔔</span>
            </Link>
          </div>

          {/* Logout (Desktop only) */}
          <button
            onClick={handleLogout}
            className="hidden md:block px-6 py-2 rounded-full border border-gray-300 dark:border-slate-600 hover:border-gray-900 dark:hover:border-gray-400 text-gray-700 dark:text-gray-300 text-sm font-bold transition ml-4"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
