import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function About() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans selection:bg-purple-200 dark:selection:bg-purple-900">
            {/* Premium Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-gray-100 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link to="/" className="hover:scale-105 transition-transform duration-300">
                        <Logo textClassName="text-2xl font-serif font-bold tracking-tighter" />
                    </Link>
                    <div className="flex gap-4">
                        <Link to="/login" className="px-6 py-2.5 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 transition">Log In</Link>
                        <Link to="/register" className="px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm hover:shadow-lg hover:scale-105 transition duration-300">Sign Up</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-40 pb-20 px-6 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
                <h1 className="relative text-6xl md:text-8xl font-serif font-bold mb-8 tracking-tight animate-fade-in-up">
                    We Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Limerence.</span>
                </h1>
                <p className="relative max-w-2xl mx-auto text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                    The social reading platform for the BookTok generation. Obsessing over fictional characters is better together.
                </p>
            </div>

            {/* Content Cards */}
            <div className="max-w-5xl mx-auto px-6 pb-32 space-y-24">
                {/* Story Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 relative group">
                        <div className="absolute inset-0 bg-purple-200 dark:bg-purple-900/50 rounded-3xl rotate-3 transition group-hover:rotate-6"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80" 
                            alt="Reading together" 
                            className="relative rounded-3xl shadow-2xl z-10 w-full h-[400px] object-cover grayscale group-hover:grayscale-0 transition duration-700"
                        />
                    </div>
                    <div className="order-1 md:order-2">
                         <h2 className="text-4xl font-serif font-bold mb-6">Our Story</h2>
                         <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                            Born from late-night reading sessions and endless group chats about "that plot twist," 
                            Limerence was created to give readers a home. A place where you can track your books, 
                            discover new favorites, and scream into the void with fellow book lovers.
                         </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div>
                    <h2 className="text-4xl font-serif font-bold mb-12 text-center">What We Offer</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: "📚", title: "Personal Shelf", desc: "Track what you're reading, want to read, and have finished with style." },
                            { icon: "💬", title: "Book Clubs", desc: "Join clubs and discuss your favorite reads in real-time chat rooms." },
                            { icon: "🏆", title: "Reading Goals", desc: "Set yearly goals and track your progress with exclusive badges." },
                            { icon: "✨", title: "Stories", desc: "Share updates, quotes, and reactions with your network in 24h stories." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-slate-100 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition duration-300">
                                <span className="text-4xl mb-4 block">{item.icon}</span>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mission */}
                <div className="bg-slate-900 dark:bg-white/5 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8 relative z-10">Our Mission</h2>
                    <p className="text-xl text-slate-300 dark:text-slate-300 max-w-2xl mx-auto mb-12 relative z-10">
                        To make reading social, fun, and accessible for everyone. Whether you're into dark romance, 
                        fantasy epics, or late-night fanfiction, there's a place for you here.
                    </p>
                    <Link 
                        to="/register" 
                        className="relative z-10 inline-block px-12 py-4 bg-white text-slate-900 font-bold rounded-full shadow-lg hover:shadow-white/20 hover:scale-105 transition duration-300"
                    >
                        Join the Community
                    </Link>
                </div>
            </div>

            {/* Premium Footer */}
            <footer className="bg-white dark:bg-black border-t border-slate-100 dark:border-white/10 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 dark:text-slate-500">
                    <p>© {new Date().getFullYear()} Limerence Inc.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <Link to="/about" className="hover:text-slate-900 dark:hover:text-white transition">About</Link>
                        <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">Privacy</Link>
                        <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
