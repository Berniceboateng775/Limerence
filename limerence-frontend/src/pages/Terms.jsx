import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Terms() {
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
                <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight">Terms of Service</h1>
                <p className="text-xl text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 pb-32">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="lead text-xl text-slate-600 dark:text-slate-300 mb-8">
                           Welcome to Limerence. By using our platform, you agree to these terms. Ideally, you read them, unlike the terms of that 
                           contract the protagonist signed in Chapter 3 without looking.
                        </p>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">1. Acceptance of Terms</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            By accessing Limerence, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                            If you do not agree with any of these terms, you are prohibited from using this site.
                        </p>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">2. User Conduct</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Be nice. Don't spoil endings without warnings. Don't be a troll. We reserve the right to 
                            suspend accounts that violate our community guidelines, which basically boil down to "don't be a jerk."
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mb-8">
                            <li>No hate speech or harassment</li>
                            <li>No spamming book clubs</li>
                            <li>Respect the "Dark" in Dark Romance, but respect real people more.</li>
                        </ul>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">3. Content Ownership</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            You own the content you post (reviews, stories, lists). By posting, you grant Limerence a non-exclusive license 
                            to display that content on the platform. We won't sell your fanfic to Hollywood (unless you want us to, then call us).
                        </p>

                        <h3 className="text-2xl font-bold mb-4 font-serif text-slate-900 dark:text-white">4. Termination</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                             We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
                             including without limitation if you breach the Terms.
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
