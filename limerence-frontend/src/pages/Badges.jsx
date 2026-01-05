import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function Badges() {
    const { token } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);

    const allBadges = [
        // Reading Milestones
        { name: "Bookworm", icon: "📚", description: "Read your first book" },
        { name: "Page Turner", icon: "📖", description: "Read 5 books" },
        { name: "Bibliophile", icon: "🤓", description: "Read 10 books" },
        { name: "Library Dweller", icon: "🏛️", description: "Read 25 books" },
        { name: "Book Hoarder", icon: "📔", description: "Read 50 books" },
        { name: "Literary Legend", icon: "👑", description: "Read 100 books" },
        
        // Genre Specific
        { name: "Hopeless Romantic", icon: "💘", description: "Read 5 Romance books" },
        { name: "Heartbreaker", icon: "💔", description: "Read 10 Romance books" },
        { name: "Fantasy Explorer", icon: "🐉", description: "Read 5 Fantasy books" },
        { name: "Magic Wielder", icon: "🪄", description: "Read 10 Fantasy books" },
        { name: "Detective", icon: "🕵️‍♀️", description: "Read 5 Mystery books" },
        { name: "Thriller Seeker", icon: "🔪", description: "Read 5 Thriller books" },
        { name: "Sci-Fi Voyager", icon: "👽", description: "Read 5 Sci-Fi books" },
        { name: "Historical Buff", icon: "⏳", description: "Read 5 Historical Fiction books" },
        { name: "Dark Romance Devotee", icon: "💀", description: "Read 5 Dark Romance books" },
        
        // Social & Community
        { name: "Social Butterfly", icon: "🦋", description: "Join 3 Book Clubs" },
        { name: "Club Leader", icon: "🗣️", description: "Create a Book Club" },
        { name: "Chatterbox", icon: "💬", description: "Send 100 messages in clubs" },
        { name: "Friend Collector", icon: "🤝", description: "Make 10 friends" },
        { name: "Popular", icon: "🌟", description: "Receive 50 friend requests" },
        { name: "Top Critic", icon: "✍️", description: "Post 10 Reviews" },
        { name: "Review Influencer", icon: "📢", description: "Post 50 Reviews" },
        { name: "Sticker Master", icon: "🎨", description: "Send 50 stickers" },
        { name: "Gossip Queen", icon: "☕", description: "Active in chat for 7 days streak" },
        
        // Misc & Fun
        { name: "Night Owl", icon: "🦉", description: "Read a book after midnight" },
        { name: "Early Bird", icon: "☀️", description: "Read a book before 8 AM" },
        { name: "Weekend Warrior", icon: "⚔️", description: "Read a book in 2 days" },
        { name: "Speed Reader", icon: "⚡", description: "Finish a book in one sitting" },
        { name: "Marathoner", icon: "🏃‍♀️", description: "Read for 5 hours continuously" },
        { name: "Limerence Loyal", icon: "💜", description: "Member for 1 year" },
        { name: "Beta Tester", icon: "🛠️", description: "Joined during beta" },
        { name: "Reviewer of the Month", icon: "🏆", description: "Top reviewer status" }
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get("/api/users/me", {
                    headers: { "x-auth-token": token }
                });
                setProfile(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, [token]);

    const isEarned = (badgeName) => {
        return profile?.badges?.some(b => b.name === badgeName);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors duration-300">
             {/* Premium Hero */}
            <div className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
                <h1 className="relative text-5xl md:text-7xl font-serif font-bold mb-4 tracking-tighter text-slate-900 dark:text-white">
                    Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">Fame.</span>
                </h1>
                <p className="relative text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                    Track your journey from casual reader to obsessive literary critic. 
                    Unlock badges as you read, chat, and scream about plot twists.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {allBadges.map((badge) => {
                        const earned = isEarned(badge.name);
                        return (
                            <div 
                                key={badge.name} 
                                className={`relative p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center text-center group overflow-hidden ${
                                    earned 
                                    ? "bg-white dark:bg-white/5 backdrop-blur-md border-purple-200 dark:border-white/10 shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:border-purple-400 dark:hover:border-purple-500/50" 
                                    : "bg-slate-100 dark:bg-slate-900/50 border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                }`}
                            >
                                {earned && <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
                                
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 transition-transform duration-500 group-hover:scale-110 ${
                                    earned ? "bg-purple-50 dark:bg-white/10 shadow-inner" : "bg-slate-200 dark:bg-slate-800"
                                }`}>
                                    {badge.icon}
                                </div>
                                
                                <h3 className={`font-bold text-lg mb-2 leading-tight relative z-10 ${earned ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                                    {badge.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 relative z-10 leading-relaxed font-medium">{badge.description}</p>
                                
                                {earned && (
                                    <div className="absolute top-3 right-3 text-yellow-400 animate-pulse drop-shadow-md">
                                        ✨
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
