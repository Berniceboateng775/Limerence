import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Typewriter from "../components/Typewriter";

export default function LandingPage() {
  const navigate = useNavigate();
  const FALLBACK_COVER = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=600&q=80";
  const trendingRef = useRef(null);
  const featuredRef = useRef({});
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [featureOne, setFeatureOne] = useState([]);
  const [featureTwo, setFeatureTwo] = useState([]);
  const [darkHero, setDarkHero] = useState([]); // Books for Hero Section
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const AUTHOR_FOCUS = [
    "Sarah J. Maas",
    "Penelope Ward",
    "Rina Kent",
    "Rebecca Yarros",
    "C.R. Jane",
    "J.J. McAvoy",
    "L.J. Shen",
    "Tracey Delaney",
    "Leigh Rivers",
    "Skyler Mason",
    "Jordan Silver",
    "Liz Tomforde",
    "Somme Sketcher",
    "Callie Hart",
    "Elsie Silver",
    "Veronica Eden",
    "Megan Brandy",
    "Monty Jay",
    "Raven Wood",
    "Ali Hazelwood",
    "L. Steele",
    "Cora Reilly",
    "Khai Hang",
    "Neila Alarcon",
    "Shantel Tessier",
    "Runyx"
  ];

  const SUBJECT_FOCUS = [
    "romance",
    "fantasy",
    "young_adult_fiction",
    "contemporary_romance",
    "new_adult",
    "dark_romance"
  ];

  const genreTiles = useMemo(() => ([
    { name: "Dark Romance", image: "https://imgs.search.brave.com/LFq6hIz1PdJJEmw6TpuID7f3XyxaOLX1z1TIOklKwGE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMuc3F1YXJlc3Bh/Y2UtY2RuLmNvbS9j/b250ZW50L3YxLzYy/OTc4NTE0ZDU1MWI4/MWFkZDVlMGFkZi8x/YmViMWY4NS1iMDNi/LTRmYzQtYTIzYy0y/ZGFjOGJjOGI5YmIv/Q291cGxlKy5qcGc" },
    { name: "High School", image: "https://imgs.search.brave.com/D92BGOPTQs0Nfkg99Cw3XApjjGdtrevhQHWenyQW_G8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNjk5/MzEyNDk4L3Bob3Rv/L3VyYmFuLXlvdW5n/LWZlbWFsZS1yZWFs/LWNvdXBsZS1lbmpv/eWluZy1vdXRkb29y/LmpwZz9zPTYxMng2/MTImdz0wJms9MjAm/Yz12TDRSeENKWWM3/Q3Zyckkwc2R0dHNq/NkpyenlhQnNJcFVR/SFZ3OEdJdTZRPQ" },
    { name: "Mafia", image: "https://imgs.search.brave.com/6OevXF7sLvC9sjE_NoRgnJ6LURx3bi5YcPllLPZjn1I/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA3LzEwLzAwLzAy/LzM2MF9GXzcxMDAw/MDI2MV9Ba3o5SURy/Q1B2ZkFiNjdrYzBh/eERieFBNamNLTFFZ/ei5qcGc" },
    { name: "Fantasy", image: "https://imgs.search.brave.com/LHXm6HjDN28kFqC6JgucsNHk2PEPgTiabNBhCDs81lU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/cHJlbWl1bS1waG90/by9mYW50YXN5LXdh/bGxwYXBlcl82NjUy/ODAtMTEyNjQuanBn/P3NlbXQ9YWlzX2h5/YnJpZCZ3PTc0MCZx/PTgw" },
    { name: "Fanfiction", image: "https://imgs.search.brave.com/maMbcplHt51sAJGx9hfsd_iP8jOZ4-LCtjyAfTotDqs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9wdWxw/LWZpY3Rpb24tbmVv/bi1zaWduLXdhbGwt/YnVkYXBlc3QtaHVu/Z2FyeS1mZWJydWFy/eS1wdWxwLWZpY3Rp/b24tbW92aWUtdGl0/bGUtbmVvbi1zaWdu/LXdhbGwtcHViLTMx/NzU2NDgxOS5qcGc" },
    { name: "Limerence Originals", image: "https://imgs.search.brave.com/PAOF75aeM5zKrkkI3RzhKxsCx0dJez_Yk9xuW3b0li0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/bmljb2xlbWF0dXNv/dy5jb20vaW1hZ2Vz/L2xvdmUtYWRkaWN0/aW9uLmpwZw" },
    { name: "Short Story", image: "https://images.unsplash.com/photo-1473181488821-2d23949a045a?auto=format&fit=crop&w=600&q=80" },
  ]), []);

  const featuredRows = useMemo(() => ([
    {
      title: "Binge. Feel. Repeat.",
      accent: "bg-gradient-to-r from-amber-100 via-pink-50 to-rose-100",
      books: featureOne.length ? featureOne : featureTwo,
    },
    {
      title: "Late-Night Fanfiction",
      accent: "bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-100",
      books: featureTwo.length ? featureTwo : featureOne,
    }
  ]), [featureOne, featureTwo]);

  const safeCover = (src, alt) => src || alt || FALLBACK_COVER;

  const scrollRow = (ref, dir) => {
    if (!ref?.current) return;
    const distance = Math.max(240, ref.current.clientWidth * 0.6);
    ref.current.scrollBy({ left: dir === "next" ? distance : -distance, behavior: "smooth" });
  };

  const toCover = (item) => {
    const coverId = item.cover_id || item.cover_i;
    if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    if (item.isbn && item.isbn.length) return `https://covers.openlibrary.org/b/isbn/${item.isbn[0]}-L.jpg`;
    return null;
  };

  const mapWork = (w) => ({
    id: w.key || w.id || w.title,
    title: w.title || "Untitled",
    author: w.authors?.[0]?.name || w.author_name?.[0] || "Unknown",
    cover: toCover(w),
    altCover: FALLBACK_COVER,
    rating: w.ratings_average ? Number(w.ratings_average.toFixed(1)) : (4 + Math.random() * 1).toFixed(1),
  });

  const dedupeBooks = (list) => {
    const seen = new Set();
    return list.filter((b) => {
      const key = `${b.title}-${b.author}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const ensureCount = (arr, source, count) => {
    const base = arr.length ? arr : source;
    if (!base.length) return [];
    const pool = [...arr];
    let idx = 0;
    while (pool.length < count) {
      pool.push(base[idx % base.length]);
      idx += 1;
    }
    return pool.slice(0, count);
  };

  const fetchAll = useCallback(async () => {
    let aborted = false;
    try {
      setLoading(true);
      setErrorMsg("");

      const authorQuery = (author, limit = 12) =>
        `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&language=eng&published_in=2020-2024&fields=title,cover_i,cover_id,author_name,isbn,key,ratings_average&limit=${limit}`;

      const subjectQuery = (subject, limit = 24) =>
        `https://openlibrary.org/subjects/${subject}.json?limit=${limit}`;

      const authorPromises = AUTHOR_FOCUS.map((a) =>
        fetch(authorQuery(a)).then((r) => r.json()).catch(() => ({ docs: [] }))
      );

      const subjectPromises = SUBJECT_FOCUS.map((s) =>
        fetch(subjectQuery(s)).then((r) => r.json()).catch(() => ({ works: [] }))
      );

      const [authorResults, subjectResults, darkResult] = await Promise.all([
        Promise.all(authorPromises),
        Promise.all(subjectPromises),
        // Fetch specific Dark Romance for Hero
        fetch(subjectQuery("dark_romance", 6)).then((r) => r.json()).catch(() => ({ works: [] }))
      ]);
      if (aborted) return;

      const fromAuthors = authorResults
        .flatMap((res) => res.docs || [])
        .map(mapWork)
        .filter((b) => b.title);

      const fromSubjects = subjectResults
        .flatMap((res) => res.works || [])
        .map(mapWork)
        .filter((b) => b.title);

      // Dark Romance Specifics
      const darkDocs = darkResult?.works || [];
      const darkBooks = darkDocs.map(mapWork).filter(b => b.cover);
      setDarkHero(shuffle(darkBooks).slice(0, 2));

      const combined = dedupeBooks([...fromAuthors, ...fromSubjects]);

      const pool = combined.length ? combined : [];
      if (!pool.length) {
        setTrendingBooks([]);
        setFeatureOne([]);
        setFeatureTwo([]);
        setErrorMsg("Could not load books right now. Please retry.");
        setLoading(false);
        return;
      }

      let extendedPool = [...pool];
      while (extendedPool.length < 72) {
        extendedPool = [...extendedPool, ...pool];
      }
      const master = shuffle(extendedPool).slice(0, 72);

      const trending = ensureCount(master.slice(0, 18), master, 18);
      const rowOne = ensureCount(master.slice(18, 36), master, 16);
      const rowTwo = ensureCount(master.slice(36, 54), master, 16);

      setTrendingBooks(trending);
      setFeatureOne(rowOne.length ? rowOne : master.slice(0, 12));
      setFeatureTwo(rowTwo.length ? rowTwo : master.slice(12, 24));
    } catch (err) {
      if (aborted) return;
      setErrorMsg("Book covers are slow to load. Retrying will help.");
    } finally {
      if (!aborted) setLoading(false);
    }
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset scroll position when fresh data arrives so numbering starts at 1 in view
  useEffect(() => {
    if (trendingRef.current) trendingRef.current.scrollLeft = 0;
    Object.values(featuredRef.current || {}).forEach((el) => {
      if (el) el.scrollLeft = 0;
    });
  }, [trendingBooks, featureOne, featureTwo]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50 animate-fade-in-down">
          <div className="text-2xl font-serif font-bold tracking-tighter text-slate-900">Limerence</div>
          <div className="flex gap-4">
              <Link to="/login" className="px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition text-sm text-slate-700">Log In</Link>
              <Link to="/register" className="px-6 py-2 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition text-sm">Sign Up</Link>
          </div>
      </nav>

      {/* Hero Section - Static Books + Bubbles */}
      <div className="relative min-h-[95vh] flex items-center pt-20 bg-gradient-to-br from-purple-50 via-white to-rose-50 overflow-hidden">
         {/* Background Blobs */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-purple-200/30 to-rose-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
         
         <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
             {/* Left: Content */}
             <div className="space-y-8 text-center lg:text-left z-20">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-purple-100 animate-bounce-slow cursor-default hover:shadow-md transition">
                     <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                     </span>
                     <span className="text-xs font-bold text-gray-600 tracking-wide">14,203 READERS ONLINE</span>
                 </div>

                 <div className="h-[240px] md:h-[280px] flex flex-col justify-center">
                    <h1 className="text-6xl lg:text-8xl font-serif font-bold text-slate-900 leading-[0.9] tracking-tight">
                        Read.<br/>
                        Obsess.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-rose-500 block h-[1.1em]">
                            <Typewriter words={["Repeat.", "Scream.", "Connect.", "Fanboy."]} speed={100} deleteSpeed={100} delay={2000} />
                        </span>
                    </h1>
                 </div>
                 
                 <p className="text-xl text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                     The social book club for the BookTok generation. Join for the stories, stay for the chaotic group chats.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                     <button 
                        onClick={() => navigate('/register')}
                        className="px-10 py-4 bg-slate-900 text-white text-lg font-bold rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition flex items-center justify-center gap-2"
                     >
                         Start Reading <span>→</span>
                     </button>
                     <button 
                        onClick={() => navigate('/home')} 
                        className="px-10 py-4 bg-white text-slate-900 text-lg font-bold rounded-full border border-gray-200 hover:bg-gray-50 transition"
                     >
                         Explore Library
                     </button>
                 </div>
             </div>

             {/* Right: Static Books (No Rotation) */}
             <div className="relative h-[600px] hidden lg:block">
                 {/* Floating Chat Bubbles */}
                 <div className="absolute top-20 left-0 bg-white p-4 rounded-2xl rounded-bl-sm shadow-xl z-30 animate-float-slow max-w-[200px] border border-gray-100">
                     <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center text-[10px] font-bold">EM</div>
                         <span className="text-xs font-bold text-gray-400">@em_reads</span>
                     </div>
                     <p className="text-sm font-medium text-gray-800">"We're all collectively losing our minds over Chapter 55 right? 😭"</p>
                     <span className="text-red-500 text-xs mt-2 block">❤ 1.2k</span>
                 </div>

                 <div className="absolute bottom-40 right-0 bg-white p-4 rounded-2xl rounded-br-sm shadow-xl z-30 animate-float-delayed max-w-[220px] border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-[10px] font-bold">AL</div>
                         <span className="text-xs font-bold text-gray-400">@alex_page</span>
                     </div>
                     <p className="text-sm font-medium text-gray-800">"SOMEONE PASS THE POPCORN 🍿 This plot twist!"</p>
                 </div>

                 {/* Dual Book Display */}
                 <div className="absolute top-10 right-10 w-64 aspect-[2/3] rounded-xl shadow-2xl z-10 border-4 border-white hover:scale-105 transition duration-500">
                     <img 
                       src={safeCover(darkHero[0]?.cover, darkHero[0]?.altCover)} 
                       referrerPolicy="no-referrer"
                       className="w-full h-full object-cover rounded-lg" 
                       alt="Cover" 
                     />
                 </div>

                 <div className="absolute top-40 left-10 w-60 aspect-[2/3] rounded-xl shadow-2xl z-20 border-4 border-white hover:scale-105 transition duration-500">
                     <img 
                       src={safeCover(darkHero[1]?.cover, darkHero[1]?.altCover)} 
                       referrerPolicy="no-referrer"
                       className="w-full h-full object-cover rounded-lg" 
                       alt="Cover" 
                     />
                 </div>
             </div>
         </div>
      </div>

      {/* Genre Banner Section (Reference 2) */}
      <div className="bg-white py-24 border-y border-gray-100 relative overflow-hidden">
          <div className="absolute -left-20 top-20 w-96 h-96 bg-purple-50 rounded-full blur-[100px] opacity-60"></div>
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                  <h2 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
                      All the genres.<br/> All the tropes.<br/> All you.
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                      Find your next favorite read, no matter your mood or vibe (we're not judging).
                  </p>
                   {/* Search Pill */}
                  <div className="bg-white shadow-xl rounded-full p-2 flex items-center max-w-md border border-gray-100 h-16 cursor-text" onClick={() => navigate('/home')}>
                      <span className="pl-4 text-xl mr-3">🔍</span>
                      <span className="text-gray-500 font-medium text-lg">
                          <Typewriter 
                            words={["Search 'fake dating'...", "Search 'enemies to lovers'...", "Search 'who hurt you?'...", "Search 'spicy books'...", "Search 'mafia bosses'..."]} 
                            speed={100} 
                            deleteSpeed={100} 
                            delay={5000} 
                          />
                      </span>
                  </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {genreTiles.map(({ name, image }) => (
                       <div 
                         key={name} 
                         className="relative overflow-hidden rounded-2xl shadow-md group cursor-pointer h-32"
                       >
                          <img 
                            src={safeCover(image)} 
                            onError={(e) => (e.currentTarget.src = FALLBACK_COVER)} 
                            alt={name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                          <div className="absolute bottom-3 left-3 text-white font-bold text-lg drop-shadow">
                              {name}
                          </div>
                       </div>
                   ))}
              </div>
          </div>
      </div>

      {/* NEW: Trending Banner Section */}
      <div className="py-20 bg-slate-50">
           <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">Trending Books</h2>
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">HOT</span>
                </div>
                
                <div className="relative">
                  {loading && (
                    <div className="text-sm text-slate-500 mb-3">Loading books…</div>
                  )}
                  <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x" ref={trendingRef}>
                    {(() => {
                      const pool = trendingBooks.length ? trendingBooks : [];
                      const base = ensureCount(pool, pool, 24);
                      return base;
                    })().map((book, i) => (
                         <div 
                           key={book.id || book.title} 
                           className="group cursor-pointer min-w-[150px] sm:min-w-[170px] md:min-w-[190px] snap-start"
                           onClick={() => navigate('/register')}
                         >
                             <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-2xl transition duration-300">
                                 <img 
                                   src={safeCover(book.cover, book.altCover)} 
                                   onError={(e) => (e.currentTarget.src = FALLBACK_COVER)} 
                                   className="w-full h-full object-cover" 
                                   alt={book.title} 
                                   loading="lazy"
                                   referrerPolicy="no-referrer"
                                 />
                                 <div className="absolute top-2 left-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                                     {i + 1}
                                 </div>
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                             </div>
                             <h3 className="mt-3 font-bold text-slate-900 group-hover:text-purple-600 transition truncate">{book.title}</h3>
                             <p className="text-xs text-gray-500 truncate">{book.author}</p>
                             <div className="flex items-center gap-1 mt-1 text-xs font-bold text-orange-500">
                                 <span>★</span> {book.rating}
                             </div>
                        </div>
                    ))}
                    {trendingBooks.length === 0 && !loading && (
                      <div className="text-sm text-slate-500 py-6">
                        No books loaded. <button onClick={fetchAll} className="text-purple-600 font-bold hover:underline">Retry</button>
                      </div>
                    )}
                  </div>
                  <div className="hidden md:flex absolute inset-y-0 left-0 items-center pointer-events-none">
                    <button onClick={() => scrollRow(trendingRef, "prev")} className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow hover:shadow-lg flex items-center justify-center -translate-x-5">
                      ←
                    </button>
                  </div>
                  <div className="hidden md:flex absolute inset-y-0 right-0 items-center pointer-events-none">
                    <button onClick={() => scrollRow(trendingRef, "next")} className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow hover:shadow-lg flex items-center justify-center translate-x-5">
                      →
                    </button>
                  </div>
                </div>
           </div>
      </div>

      {/* Read / Fanfiction banners */}
      <div className="space-y-14 py-20 bg-white">
        {/* Conversation topper */}
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[1.2fr,1fr] gap-8 items-center mb-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Live book chat
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">Connect with book lovers everywhere</h3>
            <p className="text-slate-600">Drop into convos about the latest BookTok favorites, share theories, and find your next obsession together.</p>
          </div>
          <div className="relative rounded-3xl shadow-xl overflow-hidden border border-purple-100">
            <img 
              src="https://imgs.search.brave.com/cgMLx5e2fiDnOpZF9nxIKU5Z4O6L13JDojqxADypMJw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS12ZWN0b3Iv/aGFuZC1kcmF3bi1i/b29rLWNsdWItaWxs/dXN0cmF0aW9uXzIz/LTIxNDkzMzY1Mzku/anBnP3NlbXQ9YWlz/X2h5YnJpZCZ3PTc0/MCZxPTgw" 
              alt="Readers chatting" 
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-2xl text-sm text-slate-800 shadow-lg space-y-2">
              <div>“Chapter 55 just ruined me—in the best way.💔😔” <span className="font-bold text-purple-700">@lana_reads</span></div>
              <div>“If you liked ACOTAR, wait till you read this ending.😍” <span className="font-bold text-purple-700">@jayden_books</span></div>
              <div>“Team grumpy x sunshine forever.😁” <span className="font-bold text-purple-700">@mara_tbr</span></div>
            </div>
          </div>
        </div>

        {featuredRows.map((row) => (
          <div key={row.title} className={`${row.accent} rounded-3xl shadow-inner px-4 md:px-10 py-12 relative`}>
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full shadow-2xl overflow-hidden border-4 border-white">
              <img 
                src="https://imgs.search.brave.com/d8xiQOr_Qq-qKlEsdJlQbXQG4OuJvcOH79QWKnKE9xM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvNTAwcC81/Mi83OC9yZWFkaW5n/LW5vb2stYm9vay1s/b3ZlcnMtcXVvdGUt/dmVjdG9yLTIxMTg1/Mjc4LmpwZw" 
                alt="Featured stack" 
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex items-center justify-between mb-10 pt-10">
              <div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">{row.title}</h3>
                <p className="text-sm text-slate-600 mt-2">Swipe through the community’s current obsessions.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> Live now
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x" ref={(el) => (featuredRef.current[row.title] = el)}>
              {row.books.map((book) => (
                <div 
                  key={book.id || book.title} 
                  className="min-w-[150px] sm:min-w-[170px] md:min-w-[190px] snap-start"
                  onClick={() => navigate('/register')}
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
                    <img 
                      src={safeCover(book.cover, book.altCover)} 
                      onError={(e) => (e.currentTarget.src = FALLBACK_COVER)} 
                      className="w-full h-full object-cover" 
                      alt={book.title} 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                    <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow">
                      <p className="font-bold truncate">{book.title}</p>
                      {book.rating && (
                        <p className="text-xs text-orange-200 mt-1 flex items-center gap-1">
                          <span>★</span>{book.rating}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {row.books.length === 0 && !loading && (
                <div className="text-sm text-slate-600 py-4">
                  No books loaded. <button onClick={fetchAll} className="text-purple-600 font-bold hover:underline">Retry</button>
                </div>
              )}
              {loading && row.books.length === 0 && (
                <div className="text-sm text-slate-500 py-4">Loading books…</div>
              )}
            </div>
            <div className="hidden md:flex absolute inset-y-0 left-2 items-center pointer-events-none">
              <button onClick={() => scrollRow({ current: featuredRef.current[row.title] }, "prev")} className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow hover:shadow-lg flex items-center justify-center">
                ←
              </button>
            </div>
            <div className="hidden md:flex absolute inset-y-0 right-2 items-center pointer-events-none">
              <button onClick={() => scrollRow({ current: featuredRef.current[row.title] }, "next")} className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow hover:shadow-lg flex items-center justify-center">
                →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-slate-950 text-slate-200 py-16 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-1">
                  <h2 className="font-serif text-white text-3xl font-bold mb-6">Limerence</h2>
                  <p className="text-sm leading-relaxed opacity-70">
                      The world's most chaotic book club. Made for readers, by readers.
                  </p>
                  <div className="flex gap-4 mt-6">
                      {['📸', '🐦', '🎵'].map(icon => (
                          <button key={icon} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                              {icon}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div>
                  <h4 className="text-white font-bold mb-6">Discover</h4>
                  <ul className="space-y-3 text-sm">
                      <li className="hover:text-purple-400 cursor-pointer transition">Trending Books</li>
                      <li className="hover:text-purple-400 cursor-pointer transition">New Releases</li>
                      <li className="hover:text-purple-400 cursor-pointer transition">Authors</li>
                      <li className="hover:text-purple-400 cursor-pointer transition">Collections</li>
                  </ul>
              </div>

              <div>
                  <h4 className="text-white font-bold mb-6">Community</h4>
                  <ul className="space-y-3 text-sm">
                      <li className="hover:text-purple-400 cursor-pointer transition">Book Clubs</li>
                      <li className="hover:text-purple-400 cursor-pointer transition">Badges</li>
                      <li className="hover:text-purple-400 cursor-pointer transition">Leaderboard</li>
                      <li className="hover:text-purple-400 cursor-pointer transition">Events</li>
                  </ul>
              </div>

              <div>
                  <h4 className="text-white font-bold mb-6">Stay Updated</h4>
                  <div className="bg-white/5 p-1 rounded-full flex">
                      <input type="email" placeholder="Your email..." className="bg-transparent px-4 py-2 outline-none text-white text-sm w-full" />
                      <button className="bg-purple-600 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-700 transition text-xs">
                          JOIN
                      </button>
                  </div>
                  <p className="text-xs mt-4 opacity-50">No spam. Just books.</p>
              </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs opacity-50">
              <p>© 2024 Limerence Inc.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                  <span>Privacy Policy</span>
                  <span>Terms of Service</span>
                  <span>Cookie Settings</span>
              </div>
          </div>
      </footer>
    </div>
  );
}
