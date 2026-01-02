import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Typewriter from "../components/Typewriter";

export default function HomePage() {
  const navigate = useNavigate();

  
  // Dynamic Hero State
  const [heroBook, setHeroBook] = useState(null);

  // Fallback if API fails
  const HERO_FALLBACK = {
      id: "OL24970635W",
      title: "Hooked",
      author: "Emily McIntire",
      cover: "https://imgs.search.brave.com/_eu4p4R6A4Hc3LRSDkR20RroEaCJxppbi5bxSF9VGCI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pMC53/cC5jb20vbGlicmFy/eW9mdG9ydHVnYS5j/b20vd3AtY29udGVu/dC91cGxvYWRzLzIw/MjQvMTIvSG9va2Vk/LmpwZz9yZXNpemU9/NzEyLDEwNjgmc3Ns/PTE",
      rating: 5.0
  };

  const FALLBACK_COVER = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=600&q=80";
  
  // State for different genre rows
  const [darkRomance, setDarkRomance] = useState([]);
  const [sportsRomance, setSportsRomance] = useState([]);
  const [mafiaRomance, setMafiaRomance] = useState([]);
  const [fantasy, setFantasy] = useState([]);
  
  // New Genres
  const [werewolf, setWerewolf] = useState([]);
  const [highSchool, setHighSchool] = useState([]);
  const [newAdult, setNewAdult] = useState([]);
  const [ceo, setCeo] = useState([]);
  const [erotic, setErotic] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Refs for scrolling
  const rowRefs = useRef({});

  const scrollRow = (category, dir) => {
    const ref = rowRefs.current[category];
    if (ref) {
      const distance = 300;
      ref.scrollBy({ left: dir === "next" ? distance : -distance, behavior: "smooth" });
    }
  };

  // Helper: Shuffle Array
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Helper: Ensure we have 'count' items by repeating if necessary (The "Limitless" trick)
  const ensureCount = (arr, count) => {
    if (!arr.length) return [];
    let pool = [...arr];
    while (pool.length < count) {
      pool = [...pool, ...arr];
    }
    return pool.slice(0, count);
  };

  // Helper: OpenLibrary Cover
  const toCover = (item) => {
     if (item.cover_i) return `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`;
     if (item.cover_id) return `https://covers.openlibrary.org/b/id/${item.cover_id}-L.jpg`;
     if (item.cover_edition_key) return `https://covers.openlibrary.org/b/olid/${item.cover_edition_key}-L.jpg`;
     return null;
  };

  // Map API Result
  const mapWork = (w) => {
    let id = w.key || w.id || w.title;
    // Clean OpenLibrary Keys
    if (typeof id === 'string') {
        id = id.replace("/works/", "").replace("/books/", "").replace("/authors/", "");
    }
    return {
        id: id,
        title: w.title,
        author: w.author_name?.[0] || w.authors?.[0]?.name || "Unknown",
        cover: toCover(w),
        rating: w.ratings_average ? Number(w.ratings_average.toFixed(1)) : (4 + Math.random()).toFixed(1)
    };
  };

  // Generic Fetcher
  const fetchGenre = async (queryType, queryValue, setter) => {
      try {
          // Determine URL based on type (subject or general search)
          const url = queryType === 'subject' 
            ? `https://openlibrary.org/search.json?subject=${queryValue}&limit=60&fields=title,cover_i,author_name,key,ratings_average`
            : `https://openlibrary.org/search.json?q=${encodeURIComponent(queryValue)}&limit=60&fields=title,cover_i,author_name,key,ratings_average`;

          const res = await fetch(url);
          const data = await res.json();
          let books = (data.docs || []).map(mapWork).filter(b => b.cover); 
          
          if (books.length > 0) {
              books = shuffle(books);
              books = ensureCount(books, 50);
              setter(books);
          }
      } catch (err) {
          console.warn(`Failed to fetch ${queryValue}`, err);
      }
  };

  const fetchSearch = async (query) => {
      if (!query) return;
      try {
          const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=title,cover_i,author_name,key,ratings_average`);
          const data = await res.json();
          const books = (data.docs || []).map(mapWork).filter(b => b.cover);
          setSearchResults(books);
      } catch (e) { console.error(e); }
  };

  useEffect(() => {
      const loadAll = async () => {
          setLoading(true);
          await Promise.all([
              fetchGenre('subject', 'dark_romance', setDarkRomance),
              fetchGenre('subject', 'sports_romance', setSportsRomance),
              fetchGenre('subject', 'mafia', setMafiaRomance),
              fetchGenre('subject', 'fantasy_romance', setFantasy),
              
              // New Genres using queries for better results
              fetchGenre('q', 'werewolf romance', setWerewolf),
              fetchGenre('q', 'high school romance', setHighSchool),
              fetchGenre('subject', 'new_adult', setNewAdult),
              fetchGenre('subject', 'office_romance', setCeo),
              fetchGenre('subject', 'erotic', setErotic), // Changed to subject 'erotic'
          ]);
          setLoading(false);
      };
      loadAll();
      loadAll();
  }, []);

  // Pick Random Hero from Dark Romance when loaded
  useEffect(() => {
      if (darkRomance.length > 0) {
          const highRated = darkRomance.filter(b => b.rating >= 4.5);
          const pool = highRated.length > 0 ? highRated : darkRomance;
          const randomPick = pool[Math.floor(Math.random() * pool.length)];
          setHeroBook(randomPick);
      } else {
          setHeroBook(HERO_FALLBACK);
      }
  }, [darkRomance]);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
        if (searchQuery) fetchSearch(searchQuery);
        else setSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 pb-0 flex flex-col transition-colors duration-300">
      
      {/* Navbar / Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm">
           <div className="text-2xl font-serif font-bold tracking-tighter text-slate-900 dark:text-white cursor-pointer" onClick={() => navigate('/')}>
              
           </div>
           
           <div className="hidden md:flex relative flex-1 max-w-lg mx-auto">
               <input 
                   type="text" 
                   placeholder="Search books, authors, tropes..." 
                   className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-slate-800 rounded-full border-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-600 outline-none transition text-sm font-medium dark:text-white dark:placeholder-gray-400"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
               />
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
           </div>

           <div className="flex items-center gap-4">
              <Link to="/profile" className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold hover:bg-purple-200 transition">
                  👤
              </Link>
           </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-6">
          
          {/* SEARCH RESULTS OVERLAY */}
          {searchQuery ? (
              <div className="min-h-screen">
                  <h2 className="text-2xl font-bold mb-6 dark:text-white">Results for "{searchQuery}"</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {searchResults.map((book, i) => (
                          <div key={i} onClick={() => navigate(`/book/${book.id}`)} className="cursor-pointer group">
                             <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-gray-100 dark:bg-slate-700 mb-2">
                                 <img src={book.cover} className="w-full h-full object-cover group-hover:scale-105 transition" referrerPolicy="no-referrer" />
                             </div>
                             <h4 className="font-bold text-sm truncate dark:text-white">{book.title}</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
                          </div>
                      ))}
                      {searchResults.length === 0 && <p>No results found.</p>}
                  </div>
              </div>
          ) : (
            <>
              {/* HERO SECTION - Redesigned Height to be smaller */}
              <div className="mb-12">
                   <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/50 dark:via-pink-950/30 dark:to-rose-950/50 rounded-[2rem] p-6 relative overflow-hidden shadow-sm border border-purple-50 dark:border-purple-900/50 min-h-[350px] flex items-center">
                       {/* Background Blur */}
                       <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                       
                       <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 w-full">
                           {/* Left: Content */}
                           <div className="flex-1 text-center md:text-left space-y-4">
                               <div>
                                  <span className="bg-white text-purple-600 border border-purple-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block shadow-sm mb-2">
                                      ✨ Editor's Pick
                                  </span>
                                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white leading-[1.1] mb-1">
                                      {heroBook?.title || "Loading..."}
                                  </h2>
                                  <h3 className="text-lg text-gray-600 dark:text-gray-300 font-medium">by {heroBook?.author || "Unknown"}</h3>
                               </div>

                               <div className="h-8">
                                   <span className="text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-rose-500 font-bold">
                                       <Typewriter 
                                          words={["\"Pure Obsession.\"", "\"The villain gets the girl.\"", `"Rated ${heroBook?.rating || 5}/5 stars."`]} 
                                          speed={80} 
                                          deleteSpeed={50} 
                                          delay={2000} 
                                       />
                                   </span>
                               </div>

                               <button onClick={() => navigate(`/book/${heroBook?.id}`)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition shadow-lg hover:-translate-y-1 text-base">
                                   Read Now
                               </button>
                           </div>

                           {/* Right: Book Cover (Optimized) */}
                           <div className="flex-1 flex justify-center relative perspective-1000">
                               {/* Comment Bubble */}
                               <div className="absolute -left-10 md:left-0 top-10 bg-white p-3 rounded-2xl rounded-bl-sm shadow-xl z-30 animate-float-slow max-w-[180px] border border-gray-100 hidden md:block">
                                   <div className="flex items-center gap-2 mb-1">
                                       <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-[10px] flex items-center justify-center font-bold">S</div>
                                       <span className="text-[10px] font-bold text-gray-400">@sarah_reads</span>
                                   </div>
                                   <p className="text-xs font-medium text-gray-800">"This book ruined me in the best way possible. 10/10😭❤️"</p>
                               </div>

                               <div className="relative shadow-2xl rounded-xl border-4 border-white transform rotate-3 hover:rotate-0 transition duration-500 bg-gray-200">
                                   <img 
                                      src={heroBook?.cover} 
                                      className="h-[280px] w-auto object-contain rounded-lg" 
                                      alt={heroBook?.title}
                                      onClick={() => navigate(`/book/${heroBook?.id}`)}
                                      referrerPolicy="no-referrer"
                                   />
                               </div>
                           </div>
                       </div>
                   </div>
              </div>

              {/* GENRE ROWS - Expanded List */}
              {[
                { title: "Dark Romance", data: darkRomance, key: "dark_romance" },
                { title: "Sports Romance", data: sportsRomance, key: "sports_romance" },
                { title: "Mafia & Crime", data: mafiaRomance, key: "mafia" },
                { title: "Fantasy Worlds", data: fantasy, key: "fantasy" },
                { title: "Werewolf & Shifter", data: werewolf, key: "werewolf" },
                { title: "High School Drama", data: highSchool, key: "high_school" },
                { title: "New Adult", data: newAdult, key: "new_adult" },
                { title: "Office / CEO", data: ceo, key: "ceo" },
                { title: "Spicy / Erotic", data: erotic, key: "erotic" }
              ].map((section) => (
                  <div key={section.key} className="mb-12 relative group/row">
                      <div className="flex items-center justify-between mb-6 px-2">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                              <span className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-rose-500 rounded-full block"></span>
                              {section.title}
                          </h3>
                      </div>

                      <div 
                        className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x px-2"
                        ref={el => rowRefs.current[section.key] = el}
                      >
                          {section.data.length > 0 ? section.data.map((book, i) => (
                              <div 
                                key={i} /* Index key intentional for repeats */
                                onClick={() => navigate(`/book/${book.id}`)}
                                className="snap-start shrink-0 w-[160px] md:w-[180px] group cursor-pointer"
                              >
                                  <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:-translate-y-2 transition duration-300 relative mb-4 bg-gray-100">
                                      <img src={book.cover} className="w-full h-full object-cover" loading="lazy" onError={(e) => e.currentTarget.src = FALLBACK_COVER} referrerPolicy="no-referrer" />
                                      {/* Gradient Overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                      <div className="absolute bottom-3 left-3 text-white opacity-0 group-hover:opacity-100 transition duration-300">
                                          <p className="font-bold text-sm">★ {book.rating}</p>
                                      </div>
                                  </div>
                                  <h4 className="font-bold text-base text-slate-900 dark:text-white truncate px-1 group-hover:text-purple-600 transition">{book.title}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate px-1">{book.author}</p>
                              </div>
                          )) : (
                              // SKELETON LOADERS
                              Array(6).fill(0).map((_, i) => (
                                  <div key={i} className="shrink-0 w-[160px] md:w-[180px] dark:opacity-50">
                                      <div className="aspect-[2/3] bg-gray-100 rounded-2xl animate-pulse mb-4"></div>
                                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2 animate-pulse"></div>
                                      <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                                  </div>
                              ))
                          )}
                      </div>

                      {/* Navigation Buttons */}
                      <button 
                        onClick={() => scrollRow(section.key, "prev")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition hover:bg-white dark:hover:bg-slate-700 z-10 -ml-6 border border-gray-100 dark:border-slate-700 dark:text-white"
                      >
                          ←
                      </button>
                      <button 
                        onClick={() => scrollRow(section.key, "next")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition hover:bg-white dark:hover:bg-slate-700 z-10 -mr-6 border border-gray-100 dark:border-slate-700 dark:text-white"
                      >
                          →
                      </button>
                  </div>
              ))}
            </>
          )}

      </div>
      
      {/* Spacer to push footer down if content is short */}
      <div className="flex-grow"></div>

      {/* Footer - Simplified & Compact */}
      <footer className="bg-slate-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 py-6 mt-12 w-full transition-colors duration-300">
           <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center">
               <span className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-2">Limerence.</span>
               <p className="text-[10px] text-gray-400 dark:text-gray-500">
                   © 2024 Limerence Inc. All rights reserved.
               </p>
           </div>
      </footer>
    </div>
  );
}
