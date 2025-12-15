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
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            <div className="bg-slate-900 text-white py-12 px-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2">My Achievements</h1>
                    <p className="text-slate-400">Unlock badges as you read and interact.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {allBadges.map((badge) => {
                        const earned = isEarned(badge.name);
                        return (
                            <div 
                                key={badge.name} 
                                className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${
                                    earned 
                                    ? "bg-white border-primary shadow-lg scale-105" 
                                    : "bg-gray-100 border-transparent opacity-70 grayscale hover:grayscale-0"
                                }`}
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${
                                    earned ? "bg-primary/10" : "bg-gray-200"
                                }`}>
                                    {badge.icon}
                                </div>
                                <h3 className={`font-bold text-lg mb-1 ${earned ? "text-gray-900" : "text-gray-500"}`}>
                                    {badge.name}
                                </h3>
                                <p className="text-sm text-gray-500">{badge.description}</p>
                                
                                {earned && (
                                    <div className="absolute top-3 right-3 text-primary animate-pulse">
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
