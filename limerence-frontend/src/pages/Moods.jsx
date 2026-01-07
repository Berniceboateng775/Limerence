import React from "react";
import { useNavigate } from "react-router-dom";

// Subject queries matching HomePage format for consistent results
export const MOODS = [
  { id: "dark_romance", label: "Dark Romance", emoji: "🖤", gradient: "from-slate-900 to-slate-700", query: "dark romance", type: "q" },
  { id: "billionaire", label: "Billionaire", emoji: "💎", gradient: "from-blue-900 to-blue-600", query: "billionaire", type: "q" },
  { id: "enemies_to_lovers", label: "Enemies to Lovers", emoji: "🔥", gradient: "from-rose-900 to-red-600", query: "enemies to lovers romance", type: "q" },
  { id: "sports", label: "Sports Romance", emoji: "🏒", gradient: "from-emerald-900 to-emerald-600", query: "sports_romance", type: "subject" },
  { id: "werewolf", label: "Werewolf", emoji: "🐺", gradient: "from-indigo-900 to-purple-700", query: "werewolf romance", type: "q" },
  { id: "vampire", label: "Vampire", emoji: "🧛", gradient: "from-red-950 to-red-800", query: "vampire romance", type: "q" },
  { id: "fey", label: "Fey & Fantasy", emoji: "🧚‍♀️", gradient: "from-fuchsia-900 to-purple-600", query: "fantasy_romance", type: "subject" },
  { id: "friends_to_lovers", label: "Friends to Lovers", emoji: "🤝", gradient: "from-pink-600 to-rose-400", query: "friends to lovers romance", type: "q" },
  { id: "high_school", label: "High School", emoji: "🎒", gradient: "from-amber-700 to-orange-500", query: "high school romance", type: "q" },
  { id: "college", label: "College", emoji: "🎓", gradient: "from-sky-700 to-blue-500", query: "new_adult", type: "subject" },
  { id: "mafia", label: "Mafia", emoji: "🔫", gradient: "from-gray-900 to-gray-700", query: "mafia", type: "subject" },
  { id: "hockey", label: "Hockey", emoji: "❄️", gradient: "from-cyan-800 to-cyan-500", query: "hockey romance", type: "q" },
  { id: "office", label: "Office / CEO", emoji: "🏢", gradient: "from-slate-800 to-gray-500", query: "office_romance", type: "subject" },
  { id: "forbidden", label: "Forbidden", emoji: "🚫", gradient: "from-red-800 to-orange-700", query: "forbidden love romance", type: "q" },
  { id: "small_town", label: "Small Town", emoji: "🏡", gradient: "from-teal-800 to-green-600", query: "small town romance", type: "q" },
  { id: "mc", label: "MC / Biker", emoji: "🏍️", gradient: "from-orange-900 to-amber-700", query: "motorcycle romance biker", type: "q" },
  { id: "paranormal", label: "Paranormal", emoji: "👻", gradient: "from-violet-900 to-purple-800", query: "paranormal romance", type: "q" },
  { id: "romantic_comedy", label: "RomCom", emoji: "😂", gradient: "from-pink-500 to-rose-400", query: "romantic comedy", type: "q" },
  { id: "slow_burn", label: "Slow Burn", emoji: "⏳", gradient: "from-yellow-700 to-amber-500", query: "slow burn romance", type: "q" },
  { id: "grumpy_sunshine", label: "Grumpy x Sunshine", emoji: "☀️", gradient: "from-amber-500 to-yellow-400", query: "opposites attract romance", type: "q" },
];

export default function Moods() {
  const navigate = useNavigate();

  const handleMoodClick = (mood) => {
    navigate(`/mood/${mood.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24 transition-colors duration-300">
      {/* Header - matches Badges (Hall of Fame) page style */}
      <div className="relative pt-16 pb-12 px-6 text-center overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <h1 className="relative text-5xl md:text-7xl font-serif font-bold mb-4 tracking-tighter text-slate-900 dark:text-white">
          What's your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">vibe?</span>
        </h1>
        <p className="relative text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Pick a genre, find your next obsession.
        </p>
      </div>

      {/* Mood Cards */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleMoodClick(mood)}
            className={`
              group relative overflow-hidden rounded-3xl h-40 
              bg-gradient-to-br ${mood.gradient} 
              shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 
              transform hover:-translate-y-2 hover:scale-[1.02] 
              transition-all duration-300 ease-out
              text-center p-6 flex flex-col items-center justify-center gap-4
            `}
          >
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/10 group-hover:scale-110 transition-transform duration-300">
                {mood.emoji}
            </div>
            
            <span className="relative z-10 font-bold text-lg md:text-xl text-white tracking-wide group-hover:scale-105 transition-transform duration-300">
                {mood.label}
            </span>
            
            {/* Decorative circle */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500"></div>
          </button>
        ))}
      </div>
    </div>
  );
}
