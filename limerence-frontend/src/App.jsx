import React, { useContext, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import SplashScreen from "./components/SplashScreen";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import BookDetails from "./pages/BookDetails";
import MyShelf from "./pages/MyShelf";
import Onboarding from "./pages/Onboarding";
import Moods from "./pages/Moods";
import Profile from "./pages/Profile";
import Badges from "./pages/Badges";
import SocialFeed from "./pages/SocialFeed";
import Clubs from "./pages/Clubs";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";

import Navbar from "./components/Navbar";
import { ToastContainer } from "./components/Toast";

function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);
  const storedToken = localStorage.getItem("authToken");

  if (!token && !storedToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <div className="pb-20 md:pb-0 md:pt-16">
        {children}
      </div>
    </>
  );
}

export default function App() {
  // ✅ Keep splash screen seen state in localStorage
  const [splashSeen, setSplashSeen] = useState(() => {
    const seen = localStorage.getItem("splashSeen") === "true";
    const hasToken = Boolean(localStorage.getItem("authToken"));
    return seen || hasToken;
  });

  const handleGetStarted = () => {
    setSplashSeen(true);
    localStorage.setItem("splashSeen", "true");
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ToastContainer />
        <BrowserRouter>
          <AuthProvider>
          {!splashSeen ? (
          // 🌊 Splash Screen Flow
          <Routes>
            <Route
              path="/"
              element={<SplashScreen onGetStarted={handleGetStarted} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          // 🌸 Main App Flow
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* 🏠 Home (Protected) */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* 📖 Book Details (Protected) */}
            <Route
              path="/book/:title"
              element={
                <ProtectedRoute>
                  <BookDetails />
                </ProtectedRoute>
              }
            />

            {/* 📚 My Shelf (Protected) */}
            <Route
              path="/myshelf"
              element={
                <ProtectedRoute>
                  <MyShelf />
                </ProtectedRoute>
              }
            />

            {/* ✨ New Pages */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moods"
              element={
                <ProtectedRoute>
                  <Moods />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/badges"
              element={
                <ProtectedRoute>
                  <Badges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/social"
              element={
                <ProtectedRoute>
                  <SocialFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs"
              element={
                <ProtectedRoute>
                  <Clubs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        )}
          </AuthProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}
