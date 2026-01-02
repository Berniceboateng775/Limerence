import React from "react";
import { useNavigate } from "react-router-dom";

// Subject queries matching HomePage format for consistent results
export const MOODS = [
  { id: "dark_romance", label: "Dark Romance", emoji: "🖤", color: "bg-slate-700 dark:bg-slate-700", query: "dark romance", type: "q" },
  { id: "billionaire", label: "Billionaire", emoji: "💎", color: "bg-blue-700 dark:bg-blue-800", query: "billionaire", type: "q" },
  { id: "enemies_to_lovers", label: "Enemies to Lovers", emoji: "🔥", color: "bg-rose-700 dark:bg-rose-800", query: "enemies to lovers romance", type: "q" },
  { id: "sports", label: "Sports Romance", emoji: "🏒", color: "bg-emerald-700 dark:bg-emerald-800", query: "sports_romance", type: "subject" },
  { id: "werewolf", label: "Werewolf", emoji: "🐺", color: "bg-indigo-700 dark:bg-indigo-800", query: "werewolf romance", type: "q" },
  { id: "vampire", label: "Vampire", emoji: "🧛", color: "bg-red-800 dark:bg-red-900", query: "vampire romance", type: "q" },
  { id: "fey", label: "Fey & Fantasy", emoji: "🧚‍♀️", color: "bg-purple-700 dark:bg-purple-800", query: "fantasy_romance", type: "subject" },
  { id: "friends_to_lovers", label: "Friends to Lovers", emoji: "🤝", color: "bg-pink-700 dark:bg-pink-800", query: "friends to lovers romance", type: "q" },
  { id: "high_school", label: "High School", emoji: "🎒", color: "bg-amber-600 dark:bg-amber-700", query: "high school romance", type: "q" },
  { id: "college", label: "College", emoji: "🎓", color: "bg-blue-700 dark:bg-blue-800", query: "new_adult", type: "subject" },
  { id: "mafia", label: "Mafia", emoji: "🔫", color: "bg-gray-700 dark:bg-gray-800", query: "mafia", type: "subject" },
  { id: "hockey", label: "Hockey", emoji: "❄️", color: "bg-cyan-700 dark:bg-cyan-800", query: "hockey romance", type: "q" },
  { id: "office", label: "Office / CEO", emoji: "🏢", color: "bg-slate-600 dark:bg-slate-700", query: "office_romance", type: "subject" },
  { id: "forbidden", label: "Forbidden", emoji: "🚫", color: "bg-red-700 dark:bg-red-800", query: "forbidden love romance", type: "q" },
  { id: "small_town", label: "Small Town", emoji: "🏡", color: "bg-green-700 dark:bg-green-800", query: "small town romance", type: "q" },
  { id: "mc", label: "MC / Biker", emoji: "🏍️", color: "bg-orange-700 dark:bg-orange-800", query: "motorcycle romance biker", type: "q" },
  { id: "paranormal", label: "Paranormal", emoji: "👻", color: "bg-purple-800 dark:bg-purple-900", query: "paranormal romance", type: "q" },
  { id: "romantic_comedy", label: "RomCom", emoji: "😂", color: "bg-pink-600 dark:bg-pink-700", query: "romantic comedy", type: "q" },
  { id: "slow_burn", label: "Slow Burn", emoji: "⏳", color: "bg-amber-700 dark:bg-amber-800", query: "slow burn romance", type: "q" },
  { id: "grumpy_sunshine", label: "Grumpy x Sunshine", emoji: "☀️", color: "bg-yellow-600 dark:bg-yellow-700", query: "opposites attract romance", type: "q" },
];

export default function Moods() {
  const navigate = useNavigate();

  const handleMoodClick = (mood) => {
    navigate(`/mood/${mood.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-16 transition-colors duration-300">
      {/* Header - compact */}
      <div className="text-center py-6 px-4">
        <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-white mb-1">What's your vibe?</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Pick a mood, find your next obsession.</p>
      </div>

      {/* Mood Cards - bigger */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleMoodClick(mood)}
            className={`${mood.color} text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-2 h-28`}
          >
            <span className="text-4xl">{mood.emoji}</span>
            <span className="font-semibold text-base text-center leading-tight">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
