import React from "react";
import { useNavigate } from "react-router-dom";

export const MOODS = [
  { id: "dark_romance", label: "Dark Romance", emoji: "🖤", color: "bg-gray-800", searchTerm: "dark romance" },
  { id: "billionaire", label: "Billionaire", emoji: "💎", color: "bg-blue-600", searchTerm: "billionaire romance" },
  { id: "enemies_to_lovers", label: "Enemies to Lovers", emoji: "🔥", color: "bg-red-500", searchTerm: "enemies to lovers" },
  { id: "sports", label: "Sports Romance", emoji: "🏒", color: "bg-green-600", searchTerm: "sports romance" },
  { id: "werewolf", label: "Werewolf", emoji: "🐺", color: "bg-indigo-700", searchTerm: "werewolf" },
  { id: "vampire", label: "Vampire", emoji: "🧛", color: "bg-red-900", searchTerm: "vampire" },
  { id: "fey", label: "Fey & Fantasy", emoji: "🧚‍♀️", color: "bg-purple-500", searchTerm: "fantasy romance" },
  { id: "friends_to_lovers", label: "Friends to Lovers", emoji: "🤝", color: "bg-pink-400", searchTerm: "friends lovers" },
  { id: "high_school", label: "High School", emoji: "🎒", color: "bg-yellow-500", searchTerm: "young adult romance" },
  { id: "college", label: "College", emoji: "🎓", color: "bg-blue-400", searchTerm: "college romance" },
  { id: "mafia", label: "Mafia", emoji: "🔫", color: "bg-gray-900", searchTerm: "mafia" },
  { id: "hockey", label: "Hockey", emoji: "❄️", color: "bg-cyan-600", searchTerm: "hockey romance" },
  { id: "office", label: "Office / CEO", emoji: "🏢", color: "bg-slate-600", searchTerm: "office romance" },
  { id: "forbidden", label: "Forbidden", emoji: "🚫", color: "bg-red-700", searchTerm: "forbidden love" },
  { id: "small_town", label: "Small Town", emoji: "🏡", color: "bg-green-500", searchTerm: "small town romance" },
  { id: "mc", label: "MC / Biker", emoji: "🏍️", color: "bg-orange-700", searchTerm: "motorcycle romance" },
  { id: "paranormal", label: "Paranormal", emoji: "👻", color: "bg-purple-800", searchTerm: "paranormal romance" },
  { id: "romantic_comedy", label: "RomCom", emoji: "😂", color: "bg-pink-500", searchTerm: "romantic comedy" },
  { id: "slow_burn", label: "Slow Burn", emoji: "⏳", color: "bg-amber-600", searchTerm: "slow burn" },
  { id: "grumpy_sunshine", label: "Grumpy x Sunshine", emoji: "☀️", color: "bg-yellow-400", searchTerm: "opposites attract romance" },
];

export default function Moods() {
  const navigate = useNavigate();

  const handleMoodClick = (mood) => {
    navigate(`/mood/${mood.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-800 pb-20 transition-colors duration-300">
      {/* Header - extends into navbar padding area */}
      <div className="bg-slate-800 text-white pt-24 pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-serif font-bold mb-2">What's your vibe?</h1>
          <p className="text-gray-400">Pick a mood, find your next obsession.</p>
        </div>
      </div>

      {/* Mood Cards */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleMoodClick(mood)}
            className={`${mood.color} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-2 h-32`}
          >
            <span className="text-4xl">{mood.emoji}</span>
            <span className="font-bold text-lg text-center leading-tight">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
