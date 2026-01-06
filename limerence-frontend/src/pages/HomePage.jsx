import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Typewriter from "../components/Typewriter";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

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
  
  // Random comments for hero section
  const RANDOM_COMMENTS = [
    { user: "S", name: "@sarah_reads", text: "This book ruined me in the best way possible. 10/10😭❤️" },
    { user: "M", name: "@maya_bookish", text: "The villain had NO RIGHT to be this fine 🔥" },
    { user: "K", name: "@kindle_queen", text: "I threw my Kindle across the room TWICE 📖💔" },
    { user: "J", name: "@jess_reads", text: "Obsessed is an understatement. 5 stars!! ⭐⭐⭐⭐⭐" },
    { user: "L", name: "@lily_romance", text: "My toxic trait is rereading this 10 times 🫠" },
    { user: "A", name: "@ava_spicy", text: "The tension was UNREAL I couldn't breathe 🥵" },
    { user: "E", name: "@emma_books", text: "Morally grey men supremacy 🖤" },
    { user: "R", name: "@rachel_lit", text: "This author owns my soul now 💀" },
    { user: "N", name: "@nina_dark", text: "I need therapy after this one 😅💜" },
    { user: "C", name: "@chloe_reads", text: "The writing is BEAUTIFUL I sobbed for hours 😭" },
    { user: "Z", name: "@zoe_bookclub", text: "Best dark romance I've EVER read hands down 🙌" },
    { user: "H", name: "@hannah_tales", text: "I gasped out loud at least 12 times no cap 🤯" },
    { user: "P", name: "@paige_lover", text: "The spice level is INSANE 🌶️🔥" },
    { user: "G", name: "@grace_novels", text: "I stayed up til 4am to finish this. Worth it. 🌙" },
    { user: "T", name: "@tina_reads", text: "My book hangover lasted a WEEK 📚💫" },
    { user: "V", name: "@violet_prose", text: "The angst was chef's kiss *mwah* 😘" },
    { user: "B", name: "@bella_dark", text: "Plot twist had me SHOOK for real 😱" },
    { user: "D", name: "@diana_lit", text: "Currently crying on my lunch break 🥲" },
    { user: "F", name: "@fiona_pages", text: "The enemies-to-lovers arc DEVOURED me 💕" },
    { user: "I", name: "@ivy_novels", text: "Adding this to my 'ruined my life' shelf 📖" },
    { user: "W", name: "@willow_read", text: "THAT ending?! I need to lie down 🛏️" },
    { user: "O", name: "@olivia_book", text: "Bought 3 copies - one for me, two to throw 🎯" },
    { user: "U", name: "@uma_romance", text: "The chemistry was absolutely unmatched 💯" },
    { user: "X", name: "@xena_reads", text: "Stayed in bed all weekend for this book 📚🛋️" },
    { user: "Q", name: "@quinn_dark", text: "Why do fictional men set such high standards 😩" },
    { user: "Y", name: "@yara_books", text: "Screaming crying throwing up (in a good way) 🎭" },
    { user: "J", name: "@jade_spice", text: "The slow burn was TORTUROUS I loved it 🔥" },
    { user: "A", name: "@aria_novel", text: "10/10 would recommend to all my girls 💅" },
    { user: "L", name: "@luna_dark", text: "This book lives rent free in my head now 🏠" },
    { user: "M", name: "@mia_lit", text: "Literally forgot to eat reading this 🍽️❌" },
  ];
  const randomComment = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
  
  // State for different genre rows - now dynamic based on user preferences
  const [genreBooks, setGenreBooks] = useState({});
  const [userGenres, setUserGenres] = useState([]);

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

  // Map Google Book to App Format
  const mapGoogleBook = (item) => {
      const info = item.volumeInfo;
      return {
          id: item.id,
          title: info.title,
          author: info.authors ? info.authors[0] : "Unknown",
          cover: info.imageLinks?.thumbnail?.replace("http:", "https:") || FALLBACK_COVER,
          rating: info.averageRating || 0,
          ratingsCount: info.ratingsCount || 0 // For sorting by popularity
      };
  };

  const fetchSearch = async (query) => {
      if (!query) return;
      try {
          // PRIMARY: Use Hardcover (converts to Title Case on backend)
          const hardcoverRes = await fetch(`http://localhost:5000/api/books/hardcover/search?q=${encodeURIComponent(query)}&limit=20`);
          
          if (hardcoverRes.ok) {
              const data = await hardcoverRes.json();
              if (data.books && data.books.length > 0) {
                  const books = data.books.filter(b => b.cover).map(b => ({
                      id: b.id,
                      slug: b.slug,
                      title: b.title,
                      author: b.author,
                      cover: b.cover,
                      rating: b.rating,
                      ratingsCount: b.ratingsCount,
                      genres: b.genres,
                      moods: b.moods,
                      series: b.series,
                      source: 'hardcover'
                  }));
                  setSearchResults(books);
                  return;
              }
          }
          
          // FALLBACK: Google Books if Hardcover returns empty
          const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=20&printType=books&orderBy=relevance`;
          const res = await fetch(googleUrl);
          
          if (res.ok) {
              const data = await res.json();
              if (data.items) {
                  const BLOCKLIST = ["dictionary", "encyclopedia", "parliamentary", "journal", "handbook"];
                  let books = data.items.map(item => {
                      const info = item.volumeInfo;
                      return {
                          id: item.id,
                          title: info.title,
                          author: info.authors?.[0] || "Unknown",
                          cover: info.imageLinks?.thumbnail?.replace("http:", "https:") || null,
                          rating: info.averageRating || 0,
                          ratingsCount: info.ratingsCount || 0,
                          source: 'google'
                      };
                  }).filter(b => {
                      if (!b.cover) return false;
                      const t = b.title.toLowerCase();
                      return !BLOCKLIST.some(word => t.includes(word));
                  });
                  books.sort((a, b) => b.ratingsCount - a.ratingsCount);
                  setSearchResults(books);
              } else {
                  setSearchResults([]);
              }
          }
      } catch (e) { 
          console.error("Search error:", e); 
          setSearchResults([]);
      }
  };
  
  // Map genre names to OpenLibrary query parameters
  const genreToQuery = (genre) => {
    const mapping = {
      "Dark Romance": { type: 'subject', value: 'dark_romance' },
      "Sports Romance": { type: 'subject', value: 'sports_romance' },
      "Mafia Romance": { type: 'subject', value: 'mafia' },
      "Fantasy Romance": { type: 'subject', value: 'fantasy_romance' },
      "Werewolf": { type: 'q', value: 'werewolf romance' },
      "High School": { type: 'q', value: 'high school romance' },
      "College": { type: 'q', value: 'college romance' },
      "New Adult": { type: 'subject', value: 'new_adult' },
      "CEO/Billionaire": { type: 'subject', value: 'office_romance' },
      "Enemies to Lovers": { type: 'q', value: 'enemies to lovers romance' },
      "Friends to Lovers": { type: 'q', value: 'friends to lovers romance' },
      "Second Chance": { type: 'q', value: 'second chance romance' },
      "Forbidden Love": { type: 'q', value: 'forbidden love romance' },
      "Slow Burn": { type: 'q', value: 'slow burn romance' },
      "Paranormal": { type: 'subject', value: 'paranormal_romance' },
      "Historical Romance": { type: 'subject', value: 'historical_romance' },
      "Contemporary": { type: 'subject', value: 'contemporary_romance' },
      "Romantic Comedy": { type: 'q', value: 'romantic comedy' },
      "Suspense/Thriller": { type: 'subject', value: 'romantic_suspense' },
      "Age Gap": { type: 'q', value: 'age gap romance' },
      "Forced Proximity": { type: 'q', value: 'forced proximity romance' },
      "Fake Dating": { type: 'q', value: 'fake dating romance' },
      "Arranged Marriage": { type: 'q', value: 'arranged marriage romance' }
    };
    return mapping[genre] || { type: 'q', value: genre.toLowerCase() + ' romance' };
  };

  // Fetch user's preferred genres and load books
  useEffect(() => {
      const loadUserGenres = async () => {
          setLoading(true);
          try {
              const token = localStorage.getItem("authToken") || localStorage.getItem("token");
              if (!token) {
                  // Fallback to default genres if not logged in
                  setUserGenres(["Dark Romance", "Sports Romance", "Mafia Romance", "Fantasy Romance", "New Adult"]);
                  return;
              }
              
              // Fetch user's preferred genres from onboarding status
              const res = await axios.get("http://localhost:5000/api/onboarding/status", {
                  headers: { "x-auth-token": token }
              });
              
              const preferredGenres = res.data.preferredGenres || [];
              if (preferredGenres.length > 0) {
                  setUserGenres(preferredGenres);
              } else {
                  // Fallback to default genres
                  setUserGenres(["Dark Romance", "Sports Romance", "Mafia Romance", "Fantasy Romance", "New Adult"]);
              }
          } catch (err) {
              console.error("Failed to fetch user genres:", err);
              setUserGenres(["Dark Romance", "Sports Romance", "Mafia Romance", "Fantasy Romance", "New Adult"]);
          }
      };
      loadUserGenres();
  }, []);

  // Load books for each user genre
  useEffect(() => {
      if (userGenres.length === 0) return;
      
      const loadGenreBooks = async () => {
          setLoading(true);
          const booksData = {};
          
          await Promise.all(userGenres.map(async (genre) => {
              try {
                  const query = genreToQuery(genre);
                  const url = query.type === 'subject'
                      ? `https://openlibrary.org/search.json?subject=${query.value}&limit=60&fields=title,cover_i,author_name,key,ratings_average`
                      : `https://openlibrary.org/search.json?q=${encodeURIComponent(query.value)}&limit=60&fields=title,cover_i,author_name,key,ratings_average`;
                  
                  const res = await fetch(url);
                  const data = await res.json();
                  let books = (data.docs || []).map(mapWork).filter(b => b.cover);
                  
                  if (books.length > 0) {
                      books = shuffle(books);
                      books = ensureCount(books, 50);
                      booksData[genre] = books;
                  } else {
                      booksData[genre] = [];
                  }
              } catch (err) {
                  console.warn(`Failed to fetch ${genre}`, err);
                  booksData[genre] = [];
              }
          }));
          
          setGenreBooks(booksData);
          setLoading(false);
      };
      
      loadGenreBooks();
  }, [userGenres]);

  // Pick Random Hero from first genre when loaded
  useEffect(() => {
      const firstGenreBooks = genreBooks[userGenres[0]] || [];
      if (firstGenreBooks.length > 0) {
          const highRated = firstGenreBooks.filter(b => b.rating >= 4.5);
          const pool = highRated.length > 0 ? highRated : firstGenreBooks;
          const randomPick = pool[Math.floor(Math.random() * pool.length)];
          setHeroBook(randomPick);
      } else {
          setHeroBook(HERO_FALLBACK);
      }
  }, [genreBooks, userGenres]);

  // Search Debounce - 1 second wait + minimum 5 chars for better UX
  useEffect(() => {
    // Clear results only when query is empty
    if (!searchQuery) {
        setSearchResults([]);
        return;
    }
    
    // Need at least 5 chars for meaningful search
    if (searchQuery.length < 5) return;
    
    const timer = setTimeout(() => {
        fetchSearch(searchQuery);
    }, 1000); // 1 second delay
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 pb-0 flex flex-col transition-colors duration-300 pt-6">
      
      {/* Search Results Overlay */}
      {searchQuery && (
        <div className="fixed inset-0 bg-white/95 dark:bg-slate-900/95 z-40 pt-24 px-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Results for "{searchQuery}"</h2>
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
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
              {searchResults.length === 0 && <p className="col-span-full text-center text-gray-500">No results found.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 pt-6">

          {/* Floating Search Bar */}
          <div className="relative mx-auto max-w-lg mb-8 z-50">
            <input 
              type="text" 
              placeholder="Search books, authors, tropes..." 
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 outline-none transition text-sm font-medium dark:text-white dark:placeholder-gray-400 shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          
          {/* HERO SECTION */}
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
                                       <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-[10px] flex items-center justify-center font-bold">{randomComment.user}</div>
                                       <span className="text-[10px] font-bold text-gray-400">{randomComment.name}</span>
                                   </div>
                                   <p className="text-xs font-medium text-gray-800">"{randomComment.text}"</p>
                               </div>

                               <div className="relative shadow-2xl rounded-xl border-4 border-white transform rotate-3 hover:rotate-0 transition duration-500 bg-gray-200 h-[280px] w-[187px]">
                                   {heroBook?.cover ? (
                                     <img 
                                        src={heroBook?.cover} 
                                        className="h-full w-full object-cover rounded-lg" 
                                        alt={heroBook?.title}
                                        onClick={() => navigate(`/book/${heroBook?.id}`)}
                                        referrerPolicy="no-referrer"
                                     />
                                   ) : (
                                     <div className="h-full w-full rounded-lg bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 animate-pulse flex items-center justify-center">
                                       <span className="text-4xl">📚</span>
                                     </div>
                                   )}
                               </div>
                           </div>
                       </div>
                   </div>
          </div>

              {/* GENRE ROWS - Dynamic based on user's preferred genres */}
              {userGenres.map((genre, index) => (
                  <div key={genre} className="mb-12 relative group/row">
                      <div className="flex items-center justify-between mb-6 px-2">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                              <span className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-rose-500 rounded-full block"></span>
                              {genre}
                          </h3>
                      </div>

                      <div 
                        className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x px-2"
                        ref={el => rowRefs.current[genre] = el}
                      >
                          {(genreBooks[genre]?.length > 0) ? genreBooks[genre].map((book, i) => (
                              <div 
                                key={i}
                                onClick={() => navigate(`/book/${book.id}`)}
                                className="snap-start shrink-0 w-[160px] md:w-[180px] group cursor-pointer"
                              >
                                  <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:-translate-y-2 transition duration-300 relative mb-4 bg-gray-100">
                                      <img src={book.cover} className="w-full h-full object-cover" loading="lazy" onError={(e) => e.currentTarget.src = FALLBACK_COVER} referrerPolicy="no-referrer" />
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
                        onClick={() => scrollRow(genre, "prev")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition hover:bg-white dark:hover:bg-slate-700 z-10 -ml-6 border border-gray-100 dark:border-slate-700 dark:text-white"
                      >
                          ←
                      </button>
                      <button 
                        onClick={() => scrollRow(genre, "next")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition hover:bg-white dark:hover:bg-slate-700 z-10 -mr-6 border border-gray-100 dark:border-slate-700 dark:text-white"
                      >
                          →
                      </button>
                  </div>
              ))}

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
