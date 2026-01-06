import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GENRE_ICONS = {
    "Dark Romance": "🖤", "Sports Romance": "🏈", "Mafia Romance": "🔫",
    "Fantasy Romance": "🐉", "Werewolf": "🐺", "High School": "🎒",
    "College": "🎓", "New Adult": "✨", "CEO/Billionaire": "💰",
    "Enemies to Lovers": "⚔️", "Friends to Lovers": "💕", "Second Chance": "🔄",
    "Forbidden Love": "🚫", "Slow Burn": "🔥", "Paranormal": "👻",
    "Historical Romance": "🏰", "Contemporary": "🌆", "Romantic Comedy": "😂",
    "Suspense/Thriller": "😱", "Age Gap": "⏳", "Forced Proximity": "🏠",
    "Fake Dating": "💋", "Arranged Marriage": "💍"
};

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Step 1: Username
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameMsg, setUsernameMsg] = useState("");
    
    // Step 2: Goals
    const [yearlyGoal, setYearlyGoal] = useState(12);
    
    // Step 3: Genres
    const [availableGenres, setAvailableGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    
    // Step 4: Suggested Follows
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [selectedFollows, setSelectedFollows] = useState([]);
    
    // Fetch genres and suggested users
    useEffect(() => {
        const fetchData = async () => {
            try {
                const genreRes = await axios.get("http://localhost:5000/api/onboarding/genres");
                setAvailableGenres(genreRes.data.genres);
            } catch (err) {
                setAvailableGenres(Object.keys(GENRE_ICONS));
            }
        };
        fetchData();
    }, []);
    
    // Check username availability (debounced)
    useEffect(() => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            setUsernameMsg("");
            return;
        }
        
        setCheckingUsername(true);
        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/onboarding/check-username/${username}`);
                setUsernameAvailable(res.data.available);
                setUsernameMsg(res.data.msg);
            } catch (err) {
                setUsernameMsg("Error checking username");
            }
            setCheckingUsername(false);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [username]);
    
    // Fetch suggested follows when reaching step 4
    useEffect(() => {
        if (step === 4) {
            const fetchSuggested = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await axios.get("http://localhost:5000/api/onboarding/suggested-follows", 
                        { headers: { "x-auth-token": token } }
                    );
                    setSuggestedUsers(res.data.users);
                } catch (err) {
                    console.error("Failed to fetch suggested users");
                }
            };
            fetchSuggested();
        }
    }, [step]);
    
    const toggleGenre = (genre) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };
    
    const toggleFollow = (userId) => {
        if (selectedFollows.includes(userId)) {
            setSelectedFollows(selectedFollows.filter(id => id !== userId));
        } else {
            setSelectedFollows([...selectedFollows, userId]);
        }
    };
    
    const handleComplete = async () => {
        setLoading(true);
        setError("");
        
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:5000/api/onboarding/complete",
                {
                    username,
                    readingGoal: yearlyGoal,
                    monthlyGoal: Math.ceil(yearlyGoal / 12),
                    preferredGenres: selectedGenres,
                    followIds: selectedFollows
                },
                { headers: { "x-auth-token": token } }
            );
            navigate("/home");
        } catch (err) {
            setError(err.response?.data?.msg || "Something went wrong");
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                
                {/* Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`w-3 h-3 rounded-full transition-all ${step >= s ? 'bg-purple-500 scale-110' : 'bg-gray-600'}`} />
                            {i < 3 && <div className={`w-8 h-1 rounded ${step > s ? 'bg-purple-500' : 'bg-gray-700'}`} />}
                        </React.Fragment>
                    ))}
                </div>
                
                {/* Step 1: Username */}
                {step === 1 && (
                    <div className="text-center animate-fade-in">
                        <h1 className="text-4xl font-bold text-white mb-3">📝 Choose Your Username</h1>
                        <p className="text-gray-400 mb-8">This is how you'll appear in clubs and to friends</p>
                        
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-xl">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="your_username"
                                    className="w-full pl-10 pr-12 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-xl placeholder-gray-500 focus:border-purple-500 outline-none transition"
                                    maxLength={20}
                                />
                                {checkingUsername && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">...</span>
                                )}
                                {!checkingUsername && usernameAvailable !== null && (
                                    <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-2xl ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                        {usernameAvailable ? '✓' : '✗'}
                                    </span>
                                )}
                            </div>
                            
                            {usernameMsg && (
                                <p className={`mt-3 text-sm ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                    {usernameMsg}
                                </p>
                            )}
                            
                            <p className="text-gray-500 text-sm mt-4">3-20 characters, letters, numbers, and underscores only</p>
                        </div>
                        
                        <button
                            onClick={() => setStep(2)}
                            disabled={!usernameAvailable}
                            className={`mt-8 px-10 py-4 font-bold rounded-full text-lg transition-all shadow-lg ${
                                usernameAvailable
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 shadow-purple-500/30'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Continue →
                        </button>
                    </div>
                )}
                
                {/* Step 2: Reading Goal */}
                {step === 2 && (
                    <div className="text-center animate-fade-in">
                        <h1 className="text-4xl font-bold text-white mb-3">📚 Set Your Reading Goal</h1>
                        <p className="text-gray-400 mb-10">How many books this year?</p>
                        
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10">
                            <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                                {yearlyGoal}
                            </div>
                            <p className="text-gray-400 mb-8">books per year</p>
                            
                            <input
                                type="range" min="1" max="100" value={yearlyGoal}
                                onChange={(e) => setYearlyGoal(parseInt(e.target.value))}
                                className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-gray-500 text-sm mt-2">
                                <span>1</span><span>100</span>
                            </div>
                            <p className="text-gray-400 mt-6">
                                ~<span className="text-purple-400 font-bold">{Math.ceil(yearlyGoal / 12)}</span>/month
                            </p>
                        </div>
                        
                        <div className="flex gap-4 mt-8 justify-center">
                            <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20">← Back</button>
                            <button onClick={() => setStep(3)} className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg">Continue →</button>
                        </div>
                    </div>
                )}
                
                {/* Step 3: Genres */}
                {step === 3 && (
                    <div className="text-center animate-fade-in">
                        <h1 className="text-4xl font-bold text-white mb-3">💜 Pick Your Favorites</h1>
                        <p className="text-purple-400 font-medium mb-6">{selectedGenres.length}/5 selected</p>
                        
                        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-xl mb-4">{error}</div>}
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2">
                            {availableGenres.map((genre) => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                                        selectedGenres.includes(genre)
                                            ? 'bg-purple-600/30 border-purple-500 text-white scale-105'
                                            : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-xl mr-2">{GENRE_ICONS[genre] || "📖"}</span>
                                    <span className="font-medium text-sm">{genre}</span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex gap-4 mt-8 justify-center">
                            <button onClick={() => setStep(2)} className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20">← Back</button>
                            <button
                                onClick={() => selectedGenres.length >= 5 ? setStep(4) : setError("Select at least 5 genres")}
                                className={`px-10 py-4 font-bold rounded-full text-lg transition-all ${
                                    selectedGenres.length >= 5 ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105' : 'bg-gray-700 text-gray-400'
                                }`}
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Step 4: Suggested Follows */}
                {step === 4 && (
                    <div className="text-center animate-fade-in">
                        <h1 className="text-4xl font-bold text-white mb-3">👥 Find Your People</h1>
                        <p className="text-gray-400 mb-8">Follow some readers to get started</p>
                        
                        {suggestedUsers.length > 0 ? (
                            <div className="space-y-4 mb-8">
                                {suggestedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleFollow(user.id)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                            selectedFollows.includes(user.id)
                                                ? 'bg-purple-600/30 border-purple-500'
                                                : 'bg-white/5 border-transparent hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                                            {user.avatar ? (
                                                <img src={`http://localhost:5000${user.avatar}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                user.name?.[0] || "?"
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-white font-bold">{user.name}</p>
                                            <p className="text-purple-400 text-sm">@{user.username || "user"}</p>
                                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                                <span title="Books read">📚 Books read {user.booksRead}</span>
                                                <span title="Followers">👥 Followers {user.followersCount || 0}</span>
                                                <span title="Badges earned">🎖️ Badges earned {user.badgesCount || 0}</span>
                                                <span title="Clubs owned">👑 Clubs owned {user.clubsOwned || 0}</span>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                            selectedFollows.includes(user.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-600'
                                        }`}>
                                            {selectedFollows.includes(user.id) && <span className="text-white">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 mb-8">No users to suggest yet - you're one of the first!</p>
                        )}
                        
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setStep(3)} className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20">← Back</button>
                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
                            >
                                {loading ? "Saving..." : (selectedFollows.length > 0 ? "Start Reading! 🚀" : "Skip & Start 📚")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
