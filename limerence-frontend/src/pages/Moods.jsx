import React from "react";
import { useNavigate } from "react-router-dom";

const MOODS = [
  { id: "dark_romance", label: "Dark Romance", emoji: "🖤", color: "bg-gray-800" },
  { id: "billionaire", label: "Billionaire", emoji: "💎", color: "bg-blue-600" },
  { id: "enemies_to_lovers", label: "Enemies to Lovers", emoji: "🔥", color: "bg-red-500" },
  { id: "sports", label: "Sports Romance", emoji: "🏒", color: "bg-green-600" },
  { id: "werewolf", label: "Werewolf", emoji: "🐺", color: "bg-indigo-700" },
  { id: "vampire", label: "Vampire", emoji: "🧛", color: "bg-red-900" },
  { id: "fey", label: "Fey & Fantasy", emoji: "🧚‍♀️", color: "bg-purple-500" },
  { id: "friends_to_lovers", label: "Friends to Lovers", emoji: "🤝", color: "bg-pink-400" },
  { id: "high_school", label: "High School", emoji: "🎒", color: "bg-yellow-500" },
  { id: "college", label: "College", emoji: "🎓", color: "bg-blue-400" },
  { id: "mafia", label: "Mafia", emoji: "🔫", color: "bg-gray-900" },
  { id: "hockey", label: "Hockey", emoji: "❄️", color: "bg-cyan-600" },
  { id: "office", label: "Office / CEO", emoji: "🏢", color: "bg-slate-600" },
  { id: "forbidden", label: "Forbidden", emoji: "🚫", color: "bg-red-700" },
  { id: "small_town", label: "Small Town", emoji: "🏡", color: "bg-green-500" },
  { id: "mc", label: "MC / Biker", emoji: "🏍️", color: "bg-orange-700" },
  { id: "paranormal", label: "Paranormal", emoji: "👻", color: "bg-purple-800" },
  { id: "romantic_comedy", label: "RomCom", emoji: "😂", color: "bg-pink-500" },
  { id: "slow_burn", label: "Slow Burn", emoji: "⏳", color: "bg-amber-600" },
  { id: "grumpy_sunshine", label: "Grumpy x Sunshine", emoji: "☀️", color: "bg-yellow-400" },
];

export default function Moods() {
  const navigate = useNavigate();

  const handleMoodClick = (mood) => {
    // Navigate to home with the mood as a search query
    // In a real app, we might have a dedicated /browse page, but reusing Home's search logic works
    // We'll pass it as state or just assume the user will search manually, 
    // BUT the user specifically asked for it to "call books".
    // So let's navigate to a "Search Results" view. 
    // Since HomePage handles search via state, we might need a way to pass it.
    // For now, let's just trigger a search on the Home page via URL param if we implemented it,
    // OR just create a simple results page. 
    // Let's assume HomePage can read a prop or we just make a simple "GenreView".
    // Actually, let's just make this page show the books when clicked!
    
    // Simpler: Navigate to home but with a query param? 
    // Let's just alert for now or try to implement a simple view.
    // Wait, the user said "it send me back to the homepage and doesnt actually call books".
    // So I should probably make this page expand or show results.
    
    // Let's navigate to Home but we need to make Home read the query from URL?
    // I didn't implement URL query reading in Home yet.
    // Let's update this to just show the books right here in a modal or new page?
    // No, let's just make it navigate to /book/search/:genre if we had that.
    
    // Let's use the HomePage's search capability. 
    // I'll update HomePage to read `?query=` from URL.
    navigate(`/home?query=${encodeURIComponent(mood.label)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-20 transition-colors duration-300">
      <div className="bg-slate-800 dark:bg-slate-800 text-white py-8 px-4 rounded-b-[2rem] shadow-lg mb-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-serif font-bold mb-2">What's your vibe?</h1>
          <p className="text-gray-300">Pick a mood, find your next obsession.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleMoodClick(mood)}
            className={`${mood.color} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-2 h-32`}
          >
            <span className="text-4xl">{mood.emoji}</span>
            <span className="font-bold text-lg text-center leading-tight">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
