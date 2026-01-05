import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Privacy() {
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

            {/* Hero */}
            <div className="relative pt-40 pb-16 px-6 text-center">
                <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight">Privacy Policy</h1>
                <p className="text-xl text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 pb-32">
                 <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="lead text-xl text-slate-600 dark:text-slate-300 mb-8">
                            At Limerence, we respect your privacy as much as we respect your right to read questionable tropes without judgement. 
                            This policy explains how we handle your data.
                        </p>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">1. Information We Collect</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            We collect information you provide directly to us, such as when you create an account, update your profile, 
                            join a book club, or post a 3AM rant about a cliffhanger. This includes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mb-8">
                            <li>Account information (username, email, password)</li>
                            <li>Profile data (reading preferences, bio, avatar)</li>
                            <li>User-generated content (reviews, comments, stories)</li>
                        </ul>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">2. How We Use Information</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            We use your data to make Limerence better, safer, and more addictive (in a good way). Specifically:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mb-8">
                            <li>To personalize your book recommendations</li>
                            <li>To facilitate social interactions in clubs and comments</li>
                            <li>To send you updates about badges, events, and new features</li>
                        </ul>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">3. Data Sharing</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            We do not sell your personal data. We only share information with service providers who help us run the platform 
                            (like hosting and analytics), or if legally required.
                        </p>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">4. Your Rights</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            You can access, update, or delete your account at any time via your settings. If you have questions, 
                            DM us or scream into the void (we're listening).
                        </p>
                 </div>
            </div>

            {/* Footer */}
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
