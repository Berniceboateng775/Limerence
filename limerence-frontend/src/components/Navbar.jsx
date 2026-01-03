import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NotificationContext } from "../context/NotificationContext";
import axios from "axios";

export default function Navbar() {
  const { logout, token, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const { 
    unreadNotifications, 
    unreadMessages, 
    unreadDMs, 
    fetchUnreadNotifications, 
    refreshAllRules 
  } = useContext(NotificationContext);
  const location = useLocation();
  
  const [showNotifPreview, setShowNotifPreview] = useState(false);
  const [showClubsPreview, setShowClubsPreview] = useState(false);
  
  // Refresh counts on route change
  useEffect(() => {
    refreshAllRules();
  }, [location.pathname]);


  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/home", label: "Home", icon: "🏠" },
    { path: "/myshelf", label: "Library", icon: "📚" },
    { path: "/friends", label: "Friends", icon: "👯", hasDMBadge: true },
    { path: "/clubs", label: "Clubs", icon: "💬", hasBadge: true },
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
                className={`flex flex-col md:flex-row items-center gap-1 p-2 md:p-0 transition-colors duration-200 relative ${
                  isActive(link.path)
                    ? "text-primary font-bold border-t-2 border-primary md:border-t-0 md:border-b-2" 
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span className="text-xl md:text-lg mb-1 md:mb-0 md:mr-2 relative">
                  {link.icon}
                  {/* Clubs unread badge */}
                  {link.path === '/clubs' && unreadMessages > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                  {/* Friends DM unread badge */}
                  {link.path === '/friends' && unreadDMs > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadDMs > 9 ? '9+' : unreadDMs}
                    </span>
                  )}
                </span>
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
            
            {/* Notification Bell with Badge */}
            <div 
              className="relative"
              onMouseEnter={() => setShowNotifPreview(true)}
              onMouseLeave={() => setShowNotifPreview(false)}
            >
              <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition block">
                <span className="text-xl">🔔</span>
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-0 -right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                    {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                  </span>
                )}
              </Link>
              
              {/* Notification hover preview */}
              {showNotifPreview && unreadNotifications.length > 0 && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-700 rounded-xl shadow-2xl p-3 w-72 z-50 border border-gray-200 dark:border-slate-600 hidden md:block">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Notifications</h4>
                  {unreadNotifications.map((n, i) => (
                    <div key={i} className="mb-2 last:mb-0 p-2 bg-gray-50 dark:bg-slate-600 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>{n.type === 'friend_request' ? '👋' : n.type === 'friend_accept' ? '✅' : '📢'}</span>
                        <p className="text-xs text-gray-700 dark:text-gray-200 line-clamp-2">{n.content}</p>
                      </div>
                    </div>
                  ))}
                  <Link to="/notifications" className="block text-center text-xs text-primary font-bold mt-2 hover:underline">
                    View All
                  </Link>
                </div>
              )}
            </div>
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
