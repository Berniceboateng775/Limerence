import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Typewriter from "../components/Typewriter";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";

export default function LandingPage() {
  const navigate = useNavigate();
  const FALLBACK_COVER = "https://placehold.co/400x600/e2e8f0/475569?text=Cover+Missing";
  const trendingRef = useRef(null); // Keep for horizontal scroll
  const trendingSectionRef = useRef(null); // NEW: For vertical navigation
  const featuredRef = useRef({});
  const featuresRef = useRef(null);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [featureOne, setFeatureOne] = useState([]);
  const [featureTwo, setFeatureTwo] = useState([]);
  const [darkHero, setDarkHero] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [readerCount, setReaderCount] = useState(14203);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
      { text: "I've never felt so validated for staying up until 4am reading. The group chats are chaos in the best way.", user: "@sarah_reads", avatar: "👩🏻‍🦰" },
      { text: "Finally, a place where people understand why I'm crying over fictional men. My TBR is out of control.", user: "@bookish_babe", avatar: "👱‍♀️" },
      { text: "Limerence makes Goodreads look like a spreadsheet. This is where the actual community is.", user: "@chapter_verse", avatar: "🧔" },
      { text: "The reading goals feature actually made me read 50 books this year. I'm obsessed!", user: "@page_turner", avatar: "👩🏾" }
  ];

  // Dynamic Reader Count
  useEffect(() => {
      // Set initial random count between 2500 and 4500
      setReaderCount(Math.floor(Math.random() * (4500 - 2500) + 2500));
      
      const interval = setInterval(() => {
          setReaderCount(prev => prev + Math.floor(Math.random() * 7) - 3);
      }, 4000);
      return () => clearInterval(interval);
  }, []);

  // Rotate Testimonials
  useEffect(() => {
      const interval = setInterval(() => {
          setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
  }, [testimonials.length]);

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
      accent: "bg-purple-500", 
      books: featureOne.length ? featureOne : featureTwo,
    },
    {
      title: "Late-Night Fanfiction",
      accent: "bg-blue-500",
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
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden transition-colors duration-300">
      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50 animate-fade-in-down">
          <Logo />
          <div className="flex gap-4 items-center">
              <ThemeToggle />
              <Link to="/login" className="px-6 py-2 rounded-full font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition text-sm text-slate-700 dark:text-slate-200">Log In</Link>
              <Link to="/register" className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition text-sm">Sign Up</Link>
          </div>
      </nav>

      {/* Hero Section - Static Books + Bubbles */}
      <div className="relative min-h-[95vh] flex items-center pt-20 bg-gradient-to-br from-purple-50 via-white to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden transition-colors duration-300">
         {/* Background Blobs */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-purple-200/30 to-rose-200/30 dark:from-purple-900/10 dark:to-rose-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
         
         <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
             {/* Left: Content */}
             <div className="space-y-8 text-center lg:text-left z-20">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-purple-100 dark:border-slate-700 animate-bounce-slow cursor-default hover:shadow-md transition">
                     <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                     </span>
                     <span className="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wide">{readerCount.toLocaleString()} READERS ONLINE</span>
                 </div>

                 <div className="h-[240px] md:h-[280px] flex flex-col justify-center">
                    <h1 className="text-6xl lg:text-8xl font-serif font-bold text-slate-900 dark:text-white leading-[0.9] tracking-tight">
                        Read.<br/>
                        Obsess.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-rose-500 block h-[1.1em]">
                            <Typewriter words={["Repeat.", "Scream.", "Connect.", "Fanboy."]} speed={100} deleteSpeed={100} delay={2000} />
                        </span>
                    </h1>
                 </div>
                 
                 <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                     The social book club for the BookTok generation. Join for the stories, stay for the chaotic group chats.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                     <button 
                        onClick={() => navigate('/register')}
                        className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition flex items-center justify-center gap-2"
                     >
                         Start Reading <span>→</span>
                     </button>
                     <button 
                        onClick={() => navigate('/home')} 
                        className="px-10 py-4 bg-white dark:bg-transparent dark:text-white dark:border-white/20 text-slate-900 text-lg font-bold rounded-full border border-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition"
                     >
                         Explore Library
                     </button>
                 </div>
             </div>

             {/* Right: Static Books (No Rotation) */}
             <div className="relative h-[600px] hidden lg:block">
                 {/* Floating Chat Bubbles */}
                 <div className="absolute top-20 left-0 bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-sm shadow-xl z-30 animate-float-slow max-w-[200px] border border-gray-100 dark:border-slate-700">
                     <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center text-[10px] font-bold">EM</div>
                         <span className="text-xs font-bold text-gray-400">@em_reads</span>
                     </div>
                     <p className="text-sm font-medium text-gray-800 dark:text-gray-200">"We're all collectively losing our minds over Chapter 55 right? 😭"</p>
                     <span className="text-red-500 text-xs mt-2 block">❤ 1.2k</span>
                 </div>

                 <div className="absolute bottom-40 right-0 bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-br-sm shadow-xl z-30 animate-float-delayed max-w-[220px] border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center text-[10px] font-bold">AL</div>
                         <span className="text-xs font-bold text-gray-400">@alex_page</span>
                     </div>
                     <p className="text-sm font-medium text-gray-800 dark:text-gray-200">"SOMEONE PASS THE POPCORN 🍿 This plot twist!"</p>
                 </div>

                 {/* Dual Book Display */}
                 <div className="absolute top-10 right-10 w-64 aspect-[2/3] rounded-xl shadow-2xl z-10 border-4 border-white dark:border-slate-700 hover:scale-105 transition duration-500">
                     <img 
                       src={safeCover(darkHero[0]?.cover, darkHero[0]?.altCover)} 
                       referrerPolicy="no-referrer"
                       className="w-full h-full object-cover rounded-lg" 
                       alt="Cover" 
                     />
                 </div>

                 <div className="absolute top-40 left-10 w-60 aspect-[2/3] rounded-xl shadow-2xl z-20 border-4 border-white dark:border-slate-700 hover:scale-105 transition duration-500">
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

      {/* Genre Banner Section Section */}
      <div className="bg-white dark:bg-slate-900 py-24 border-y border-gray-100 dark:border-slate-800 relative overflow-hidden transition-colors duration-300">
          <div className="absolute -left-20 top-20 w-96 h-96 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-[100px] opacity-60"></div>
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                  <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                      All the genres.<br/> All the tropes.<br/> All you.
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                      Find your next favorite read, no matter your mood or vibe (we're not judging).
                  </p>
                  <div className="bg-white dark:bg-slate-800 shadow-xl rounded-full p-2 flex items-center max-w-md border border-gray-100 dark:border-slate-700 h-16 cursor-text transition-colors duration-300" onClick={() => navigate('/home')}>
                      <span className="pl-4 text-xl mr-3">🔍</span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-lg">
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
                         className="relative overflow-hidden rounded-3xl shadow-lg group cursor-pointer h-40 transform transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl hover:brightness-105"
                       >
                          <img 
                            src={safeCover(image)} 
                            onError={(e) => (e.currentTarget.src = FALLBACK_COVER)} 
                            alt={name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition duration-500"></div>
                          <div className="absolute bottom-4 left-4 text-white font-serif font-bold text-xl tracking-wide drop-shadow-md group-hover:translate-x-1 transition duration-300">
                              {name}
                          </div>
                       </div>
                   ))}
              </div>
          </div>
      </div>

      {/* Feature Highlights Section */}
      <div className="py-16 md:py-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300" ref={featuresRef}>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 dark:opacity-10 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">More Than Just a Bookshelf</h2>
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Limerence isn't just about tracking what you read—it's about <span className="italic text-purple-600 dark:text-purple-400">how</span> you read.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  {/* Card 1: Clubs */}
                  <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 p-8 rounded-3xl hover:-translate-y-2 transition duration-500 ease-out group hover:shadow-2xl dark:hover:bg-white/10">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition duration-300 shadow-sm">💬</div>
                      <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Book Clubs</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                          Find your tribe. Join specialized clubs for Dark Romance, Fantasy, or Thrillers and dissect every chapter in real-time.
                      </p>
                      <span className="text-purple-600 dark:text-purple-400 font-bold text-xs tracking-widest uppercase border-b-2 border-transparent group-hover:border-purple-500 transition">Community</span>
                  </div>

                  {/* Card 2: Goals */}
                  <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 p-8 rounded-3xl hover:-translate-y-2 transition duration-500 ease-out group hover:shadow-2xl dark:hover:bg-white/10">
                      <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition duration-300 shadow-sm">🏆</div>
                      <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Reading Goals</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                          Set your yearly target, track your pages, and earn exclusive badges for your obsession. 100 books a year? Easy work.
                      </p>
                      <span className="text-pink-600 dark:text-pink-400 font-bold text-xs tracking-widest uppercase border-b-2 border-transparent group-hover:border-pink-500 transition">Gamified</span>
                  </div>

                  {/* Card 3: Stories */}
                  <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-lg border border-slate-200 dark:border-white/10 p-8 rounded-3xl hover:-translate-y-2 transition duration-500 ease-out group hover:shadow-2xl dark:hover:bg-white/10">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition duration-300 shadow-sm">✨</div>
                      <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Stories</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                          Scream into the void. Share 24-hour reaction stories, quotes, and mood boards with your followers.
                      </p>
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-xs tracking-widest uppercase border-b-2 border-transparent group-hover:border-blue-500 transition">Social</span>
                  </div>
              </div>
          </div>
      </div>

      {/* NEW: Trending Banner Section */}
      <div className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300" ref={trendingSectionRef}>
           <div className="px-6">
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Trending Books</h2>
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">HOT</span>
                </div>
                
                <div className="relative bg-white/50 dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-slate-100 dark:border-white/10 p-6 shadow-xl">
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
                                 <div className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-sm shadow-md text-slate-900">
                                     {i + 1}
                                 </div>
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                             </div>
                             <h3 className="mt-3 font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition truncate">{book.title}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
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
                    <button onClick={() => scrollRow(trendingRef, "prev")} className="pointer-events-auto w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow hover:shadow-lg flex items-center justify-center -translate-x-5 text-slate-900 dark:text-white">
                      ←
                    </button>
                  </div>
                  <div className="hidden md:flex absolute inset-y-0 right-0 items-center pointer-events-none">
                    <button onClick={() => scrollRow(trendingRef, "next")} className="pointer-events-auto w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow hover:shadow-lg flex items-center justify-center translate-x-5 text-slate-900 dark:text-white">
                      →
                    </button>
                  </div>
                </div>
           </div>
      </div>

      {/* Read / Fanfiction banners */}
      <div className="py-10 bg-white dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
        {/* Decorative Floating Bubbles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-300/40 dark:bg-purple-600/20 rounded-full blur-2xl animate-float-slow pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-pink-300/40 dark:bg-pink-600/20 rounded-full blur-2xl animate-float-delayed pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-blue-300/40 dark:bg-blue-600/20 rounded-full blur-xl animate-pulse-slow pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[1.2fr,1fr] gap-8 items-center mb-10 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Live book chat
            </div>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">Connect with book lovers everywhere</h3>
            <p className="text-slate-600 dark:text-slate-400">Drop into convos about the latest BookTok favorites, share theories, and find your next obsession together.</p>
          </div>
          <div className="relative rounded-3xl shadow-xl overflow-hidden border border-purple-100">
            <img 
              src="https://imgs.search.brave.com/cgMLx5e2fiDnOpZF9nxIKU5Z4O6L13JDojqxADypMJw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS12ZWN0b3Iv/aGFuZC1kcmF3bi1i/b29rLWNsdWItaWxs/dXN0cmF0aW9uXzIz/LTIxNDkzMzY1Mzku/anBnP3NlbXQ9YWlz/X2h5YnJpZCZ3PTc0/MCZxPTgw" 
              alt="Readers chatting" 
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
                <div key={currentTestimonial} className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl text-slate-800 shadow-2xl animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">
                            {testimonials[currentTestimonial].avatar}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">{testimonials[currentTestimonial].user}</p>
                            <div className="flex text-amber-500 text-xs">★★★★★</div>
                        </div>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">
                        "{testimonials[currentTestimonial].text}"
                    </p>
                </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-16">
        {featuredRows.map((row) => (
          <div key={row.title} className="relative py-12 px-4 md:px-10 rounded-[2.5rem] overflow-hidden group/row transition-all duration-500 hover:shadow-2xl border border-slate-100 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-lg" ref={(el) => (featuredRef.current[row.title] = el)}>
            {/* Ambient Background Glow */}
            <div className={`absolute -top-20 -right-20 w-96 h-96 ${row.accent} rounded-full blur-[120px] opacity-10 dark:opacity-20 pointer-events-none`}></div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    {row.title}
                    <span className={`w-2 h-2 rounded-full ${row.accent} animate-pulse`}></span>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Swipe through the community’s current obsessions.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full">
                 Trending Now
              </div>
            </div>

            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x relative z-10">
              {row.books.map((book) => (
                <div 
                  key={book.id || book.title} 
                  className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] snap-start group"
                  onClick={() => navigate('/register')}
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:group-hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] transition-all duration-500 transform group-hover:-translate-y-2 group-hover:rotate-1">
                    <img 
                      src={safeCover(book.cover, book.altCover)} 
                      onError={(e) => (e.currentTarget.src = FALLBACK_COVER)} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={book.title} 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                      <p className="font-bold truncate text-sm">{book.title}</p>
                      {book.rating && (
                        <p className="text-xs text-orange-300 mt-1 flex items-center gap-1 font-bold">
                          <span>★</span>{book.rating}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {row.books.length === 0 && !loading && (
                <div className="text-sm text-slate-600 py-4 w-full text-center">
                  No books loaded. <button onClick={fetchAll} className="text-purple-600 font-bold hover:underline">Retry</button>
                </div>
              )}
            </div>
            
             <button 
                onClick={() => scrollRow({ current: featuredRef.current[row.title]?.querySelector('.overflow-x-auto') }, "prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition hover:bg-white dark:hover:bg-slate-700 z-20 hover:scale-110"
              >
                  ←
              </button>
              <button 
                onClick={() => scrollRow({ current: featuredRef.current[row.title]?.querySelector('.overflow-x-auto') }, "next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition hover:bg-white dark:hover:bg-slate-700 z-20 hover:scale-110"
              >
                  →
              </button>
          </div>
        ))}
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-white dark:bg-black text-slate-800 dark:text-slate-200 py-12 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-1">
                  <Logo className="w-10 h-10" textClassName="text-3xl font-serif font-bold tracking-tighter" />
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mt-4">
                      The world's most chaotic book club. Made for readers, by readers.
                  </p>
                  <div className="flex gap-4 mt-6">
                      {/* Social Icons (SVGs) */}
                      <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-white flex items-center justify-center transition shadow-sm">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </button>
                      <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-white flex items-center justify-center transition shadow-sm">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                      </button>
                      <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-white flex items-center justify-center transition shadow-sm">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                      </button>
                  </div>
              </div>
              
              <div>
                  <h4 className="text-slate-900 dark:text-white font-bold mb-6">Discover</h4>
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <li onClick={() => trendingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">Trending Books</li>
                      <li onClick={() => featuredRef.current[featuredRows[0].title]?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">New Releases</li>
                      <li onClick={() => navigate('/home')} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">Authors</li>
                      <li onClick={() => navigate('/home')} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">Collections</li>
                  </ul>
              </div>

              <div>
                  <h4 className="text-slate-900 dark:text-white font-bold mb-6">Community</h4>
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <li onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">Book Clubs</li>
                      <li onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">Badges</li>
                      <li onClick={() => navigate('/home')} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">Leaderboard</li>
                      <li onClick={() => navigate('/home')} className="hover:text-purple-600 dark:hover:text-white cursor-pointer transition">Events</li>
                  </ul>
              </div>

              <div>
                  <h4 className="text-slate-900 dark:text-white font-bold mb-6">Stay Updated</h4>
                  <div className="bg-slate-100 dark:bg-white/10 p-1 rounded-full flex border border-slate-200 dark:border-transparent">
                      <input type="email" placeholder="Your email..." className="bg-transparent px-4 py-2 outline-none text-slate-800 dark:text-white text-sm w-full placeholder-slate-400 dark:placeholder-gray-400" />
                      <button className="bg-slate-900 dark:bg-purple-600 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 dark:hover:bg-purple-700 transition text-xs shadow-md">
                          JOIN
                      </button>
                  </div>
                  <p className="text-xs mt-4 opacity-70">No spam. Just books.</p>
              </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-500">
              <p>© {new Date().getFullYear()} Limerence Inc.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                  <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">Privacy Policy</Link>
                  <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition">Terms of Service</Link>
                  <span className="cursor-not-allowed opacity-50">Cookie Settings</span>
              </div>
              
               <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:scale-105 transition mt-4 md:mt-0 animate-bounce cursor-pointer items-center"
              >
                  Move into Top ↑
              </button>
          </div>
      </footer>
    </div>
  );
}
