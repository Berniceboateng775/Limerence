import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TOP_BOOKS, AUTHORS } from "../data/books"; // Use Hardcoded Data

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = TOP_BOOKS.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-gray-900">
      {/* Header - Deep Dark Theme */}
      <div className="bg-gradient-to-r from-slate-900 to-purple-900 pt-8 pb-32 px-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex justify-between items-center mb-6 text-white">
                <div>
                   <h1 className="text-2xl font-bold">Good Morning, Reader.</h1>
                   <p className="text-sm text-gray-300">Dive back into your obsession.</p>
                </div>
                <Link to="/profile" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                   👤
                </Link>
            </div>

            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search titles, authors..." 
                    className="w-full p-4 pl-12 rounded-xl shadow-lg border-none focus:ring-2 focus:ring-purple-400 outline-none text-gray-900 placeholder-gray-500 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
            </div>
        </div>
      </div>

      {/* Top 10 Leaderboard - Overlapping Header */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20">
          <div className="flex items-center justify-between mb-4 px-2">
             <h2 className="text-xl font-bold text-white drop-shadow-md">Top Trending</h2>
             <Link to="/search" className="text-purple-200 text-xs font-bold hover:text-white transition">See All</Link>
          </div>
          
          <div className="flex overflow-x-auto gap-8 pb-10 pt-2 snap-x scrollbar-hide px-4">
              {filteredBooks.slice(0, 10).map((book, index) => {
                  return (
                      <div key={book.id} className="relative group flex-shrink-0 w-40 snap-start cursor-pointer transition hover:-translate-y-2">
                          {/* Big Number */}
                          <span className="absolute -left-6 -bottom-4 text-[7rem] font-bold text-slate-800/80 leading-none select-none z-0 font-serif drop-shadow-lg">
                              {index + 1}
                          </span>
                          
                          <Link to={`/book/${encodeURIComponent(book.title)}`}>
                            <div className="relative z-10 w-32 h-48 rounded-lg shadow-xl overflow-hidden ml-6 border border-white/10 group-hover:shadow-purple-500/30 transition">
                                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            </div>
                          </Link>

                          <div className="pl-6 pt-3 relative z-10 w-full">
                              <h3 className="font-bold text-sm text-gray-900 truncate leading-tight">{book.title}</h3>
                              <p className="text-xs text-gray-500 truncate">{book.author}</p>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* Trending Authors */}
      <div className="max-w-7xl mx-auto px-6 mt-4">
         <h2 className="font-bold text-xl text-gray-900 mb-6">Trending Authors</h2>
         <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide">
             {AUTHORS.map((author, i) => (
                 <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group px-2">
                     <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 to-slate-900 group-hover:scale-110 transition duration-300 shadow-md">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                            <img src={author.img} alt={author.name} className="w-full h-full object-cover" />
                        </div>
                     </div>
                     <span className="text-xs font-bold text-gray-700 group-hover:text-purple-700 text-center leading-tight">{author.name}</span>
                 </div>
             ))}
         </div>
      </div>

      {/* Recommended Section (Simple) */}
      <div className="max-w-7xl mx-auto px-6 mt-10 mb-8">
           <h2 className="font-bold text-xl text-gray-900 mb-4">Because you read "Fourth Wing"</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {TOP_BOOKS.slice(5, 11).map(book => (
                    <Link to={`/book/${encodeURIComponent(book.title)}`} key={book.id} className="block group">
                        <div className="rounded-lg overflow-hidden shadow-sm aspect-[2/3] mb-2 group-hover:shadow-md transition">
                             <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{book.title}</h4>
                        <p className="text-xs text-gray-500">{book.author}</p>
                    </Link>
                ))}
           </div>
      </div>
    </div>
  );
}
