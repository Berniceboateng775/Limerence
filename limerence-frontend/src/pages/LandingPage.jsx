import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dream-gradient text-white flex flex-col">
      {/* Navbar Placeholder (or just simple logo) */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-3xl font-serif font-bold tracking-wider">Limerence</div>
        <div className="space-x-6 hidden md:block">
          <Link to="/login" className="hover:text-pink-200 transition">Log In</Link>
          <Link to="/register" className="bg-white text-purple-600 px-6 py-2 rounded-full font-bold hover:bg-pink-100 transition shadow-lg">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 text-center">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
            Your Next <span className="text-pink-300">Dark Romance</span> Obsession Awaits
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Dive into a world of billionaires, werewolves, and forbidden love. 
            Curated just for you.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition transform duration-200"
            >
              Start Reading Now
            </Link>
            <Link 
              to="/login" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition"
            >
              I Have an Account
            </Link>
          </div>
        </div>
      </main>

      {/* Features / Moods Preview */}
      <div className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Find Your Mood</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: "🖤", label: "Dark Romance" },
              { emoji: "💎", label: "Billionaire" },
              { emoji: "🐺", label: "Werewolf" },
              { emoji: "🔥", label: "Enemies to Lovers" }
            ].map((mood, idx) => (
              <div key={idx} className="bg-white/10 p-6 rounded-2xl text-center hover:bg-white/20 transition cursor-default">
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <div className="font-bold">{mood.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-8 text-center text-white/60 text-sm">
        &copy; {new Date().getFullYear()} Limerence. All rights reserved.
      </footer>
    </div>
  );
}
