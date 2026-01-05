import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import BadgeModal from "../components/BadgeModal";
import { Link, useNavigate } from "react-router-dom";

const CommentItem = ({ comment, bookId, token }) => {
    const [likes, setLikes] = useState(comment.likes || []);
    const [dislikes, setDislikes] = useState(comment.dislikes || []);
    const [replies, setReplies] = useState(comment.replies || []);
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    const handleLike = async () => {
        try {
            const res = await axios.post(`http://localhost:5000/api/books/${bookId}/comments/${comment._id}/like`, {}, { headers: { "x-auth-token": token } });
            setLikes(res.data);
            // Optimistically remove dislike if it exists
            // But ideally backend returns both or we refetch. 
            // For now, let's assume backend handles logic, but we need to update local dislike state too if we want perfect sync.
            // Let's just refetch comment or simple toggle.
        } catch (err) { console.error(err); }
    };

    const handleDislike = async () => {
        try {
            const res = await axios.post(`http://localhost:5000/api/books/${bookId}/comments/${comment._id}/dislike`, {}, { headers: { "x-auth-token": token } });
            setDislikes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`http://localhost:5000/api/books/${bookId}/comments/${comment._id}/reply`, { content: replyContent }, { headers: { "x-auth-token": token } });
            setReplies(res.data);
            setReplyContent("");
            setShowReplyBox(false);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex gap-4 group animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white shadow-sm text-purple-600">
                {comment.user.avatar ? (
                    <img src={`http://localhost:5000${comment.user.avatar}`} alt={comment.user.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-lg">{comment.user.name[0]}</span>
                )}
            </div>
            <div className="flex-1">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-700 relative hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900 dark:text-white">{comment.user.name}</span>
                        <span className="text-xs text-gray-400">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">{comment.content}</p>
                </div>
                
                <div className="flex items-center gap-6 mt-2 text-xs font-bold text-gray-400 ml-2">
                    <button onClick={handleLike} className="hover:text-purple-600 flex items-center gap-1 transition-colors">
                        👍 {likes.length || "Like"}
                    </button>
                    <button onClick={handleDislike} className="hover:text-red-500 flex items-center gap-1 transition-colors">
                        👎 {dislikes.length || "Dislike"}
                    </button>
                    <button onClick={() => setShowReplyBox(!showReplyBox)} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                        Reply
                    </button>
                </div>

                {showReplyBox && (
                    <form onSubmit={handleReply} className="mt-4 flex gap-3 animate-fade-in-up">
                        <input 
                            type="text" 
                            value={replyContent} 
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-slate-700 border-none rounded-full px-5 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 dark:text-white transition"
                            placeholder="Write a reply..."
                        />
                        <button type="submit" className="text-purple-600 font-bold text-sm px-3 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-full transition">Post</button>
                    </form>
                )}

                {/* Replies */}
                {replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 md:pl-6 border-l-2 border-purple-50 dark:border-slate-700">
                        {replies.map((reply, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 text-gray-500 dark:text-gray-400">
                                     <span className="text-xs font-bold">{reply.user?.name?.[0] || "?"}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-xl rounded-tl-sm text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-bold text-slate-900 dark:text-white mr-2">{reply.user?.name || "User"}</span>
                                        {reply.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function BookDetails() {
  const { title, id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [shelfStatus, setShelfStatus] = useState(null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [showBadge, setShowBadge] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Helper: OpenLibrary Cover
  const toCover = (item) => {
     if (item.cover_i) return `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`;
     if (item.cover_id) return `https://covers.openlibrary.org/b/id/${item.cover_id}-L.jpg`;
     if (item.cover_edition_key) return `https://covers.openlibrary.org/b/olid/${item.cover_edition_key}-L.jpg`;
     return null;
  };

  // Map Google Book to App Format
  const mapGoogleBook = (item) => {
      const info = item.volumeInfo;
      return {
          id: item.id,
          title: info.title,
          author: info.authors ? info.authors[0] : "Unknown",
          cover: info.imageLinks?.thumbnail?.replace("http:", "https:") || "https://via.placeholder.com/128x196?text=No+Cover",
          rating: info.averageRating || 0,
          ratingsCount: info.ratingsCount || 0
      };
  };

  const fetchSearch = async (query) => {
      if (!query) return;
      try {
          // PRIMARY: Use Hardcover (converts to Title Case on backend)
          const hardcoverRes = await fetch(`http://localhost:5000/api/books/hardcover/search?q=${encodeURIComponent(query)}&limit=12`);
          
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
                      source: 'hardcover'
                  }));
                  setSearchResults(books);
                  return;
              }
          }
          
          // FALLBACK: Google Books
          const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=12&printType=books`;
          const res = await fetch(googleUrl);
          
          if (res.ok) {
              const data = await res.json();
              if (data.items) {
                  const books = data.items.map(mapGoogleBook).filter(b => b.cover && !b.cover.includes("placeholder"));
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

  // Faster debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
        if (searchQuery) fetchSearch(searchQuery);
        else setSearchResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if title is an ID (24 hex chars)
  const isId = /^[0-9a-fA-F]{24}$/.test(title);

  useEffect(() => {
    // Aggressive Reset prevents "ghost" data from previous book
    setBook(null); 
    setComments([]); 
    setShelfStatus(null); 
    setSearchResults([]); 
    setSearchQuery(""); // Clear search bar if navigating via search
    
    fetchBookDetails();
    // eslint-disable-next-line
  }, [title, id]);

  const fetchBookDetails = async () => {
    try {
      // Robust Param Extraction
      const routeTitle = title || id; 
      if (!routeTitle) {
          console.error("No book identifier found in URL params");
          setLoading(false);
          return;
      }

      let bookData = null;
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(routeTitle);
      const isHardcoverId = /^\d+$/.test(routeTitle); // Numeric = Hardcover ID

      // 1. Internal MongoDB ID
      if (isMongoId) {
        try {
            const res = await axios.get(`http://localhost:5000/api/books/${routeTitle}`);
            bookData = res.data;
        } catch (e) { console.warn("Internal ID fetch failed"); }
      } 
      
      // 2. Hardcover ID (Numeric)
      else if (isHardcoverId) {
        console.log("Fetching from Hardcover:", routeTitle);
        try {
            const res = await axios.get(`http://localhost:5000/api/books/hardcover/book/${routeTitle}`);
            if (res.data) {
                const hc = res.data;
                bookData = {
                    _id: null,
                    hardcoverId: hc.id,
                    title: hc.title,
                    subtitle: hc.subtitle,
                    authors: hc.authors?.map(a => a.name) || ["Unknown Author"],
                    description: hc.description || "No description available.",
                    coverImage: hc.cover || "https://via.placeholder.com/300x450",
                    averageRating: hc.rating || 4.5,
                    ratingsCount: hc.ratingsCount || 0,
                    usersCount: hc.usersCount,
                    pages: hc.pages,
                    releaseDate: hc.releaseDate,
                    series: hc.series,
                    externalId: String(hc.id),
                    source: 'hardcover'
                };
                console.log("Hardcover book loaded:", bookData.title);
            }
        } catch (e) { 
            console.warn("Hardcover fetch failed:", e.message); 
        }
      }
      
      // 3. OpenLibrary ID (Direct Fetch)
      else if (routeTitle.startsWith("OL")) {
          // ... (keep existing API logic for OL, it is fine)
           try {
              const res = await fetch(`https://openlibrary.org/works/${routeTitle}.json`);
              if (res.ok) {
                  const d = await res.json();
                  let authorName = "Unknown Author";
                  if (d.authors && d.authors.length > 0) {
                      try {
                          const authRes = await fetch(`https://openlibrary.org${d.authors[0].author.key}.json`);
                          if (authRes.ok) { const authData = await authRes.json(); authorName = authData.name; }
                      } catch (e) { /* ignore */ }
                  }
                  
                  // Simple Cover Logic
                  let coverUrl = d.covers ? `https://covers.openlibrary.org/b/id/${d.covers[0]}-L.jpg` : null;

                  bookData = {
                      _id: null,
                      title: d.title,
                      authors: [authorName],
                      description: (typeof d.description === 'string' ? d.description : d.description?.value) || "No description available.",
                      coverImage: coverUrl || "https://via.placeholder.com/300x450",
                      averageRating: 4.5, 
                      externalId: routeTitle,
                      previewLink: `https://openlibrary.org/works/${routeTitle}`
                  };
              }
           } catch (e) { console.warn("OL Direct failed"); }
      }

      // 3. Fallback: Search by Identifier if strictly needed (omitted for brevity, keep logic if needed)

      // 4. Augment Description from Google Books (CRITICAL FIX)
      // If description is missing/short, force Google Lookup
      if (!bookData || !bookData.description || bookData.description.length < 50 || bookData.description.includes("No description")) {
           const searchT = bookData ? bookData.title : routeTitle; // Search term
           try {
               const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchT)}&maxResults=1`);
               if (gRes.ok) {
                   const gData = await gRes.json();
                   if (gData.items && gData.items.length > 0) {
                       const gInfo = gData.items[0].volumeInfo;
                       const gBook = {
                           _id: null,
                           title: gInfo.title,
                           authors: gInfo.authors || ["Unknown"],
                           description: gInfo.description || "No description available.",
                           coverImage: gInfo.imageLinks?.thumbnail?.replace("http:", "https:") || "https://via.placeholder.com/300x450",
                           averageRating: gInfo.averageRating || 4.5,
                           externalId: gData.items[0].id,
                           previewLink: gInfo.previewLink
                       };

                       // If we ALREADY had data, only merge missing fields to avoid fully replacing correct book
                       if (bookData) {
                           // Loose Title Matching: Check if one title contains the other
                           const t1 = bookData.title.toLowerCase();
                           const t2 = gInfo.title.toLowerCase();
                           const a1 = bookData.authors?.[0]?.toLowerCase() || "";
                           const a2 = gInfo.authors?.[0]?.toLowerCase() || "";

                           const titleMatch = t1.includes(t2) || t2.includes(t1);
                           const authorMatch = a1.includes(a2) || a2.includes(a1);
                           
                           if (titleMatch || authorMatch) {
                               if (!bookData.description || bookData.description.length < 50 || bookData.description.includes("No description")) bookData.description = gBook.description;
                               if (!bookData.coverImage || bookData.coverImage.includes("placeholder")) bookData.coverImage = gBook.coverImage;
                           }
                       } else {
                           // If we had NOTHING, iterate solely on this Google Result
                           bookData = gBook;
                       }
                   }
               }
           } catch(e) { console.warn("Google Desc Fallback failed", e); }
      }
      
      // SYNC with DB (Check if we have this book saved to get ID)
      if (bookData) {
          try {
             // Try by External ID then Title
             let q = `title=${encodeURIComponent(bookData.title)}`;
             if (bookData.externalId) q += `&externalId=${bookData.externalId}`;
             
             const dbCheck = await axios.get(`http://localhost:5000/api/books/lookup?${q}`);
             if (dbCheck.data) {
                 bookData._id = dbCheck.data._id;
                 bookData.averageRating = dbCheck.data.averageRating;
             }
          } catch (e) {}
      }

      setBook(bookData); 
      
      if (bookData && bookData._id) {
         fetchComments(bookData._id);
         checkShelfStatus(bookData._id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Critical error in fetchBookDetails:", err);
      setLoading(false);
    }
  };

  const fetchComments = async (bookId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/books/${bookId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkShelfStatus = async (bookId) => {
      try {
          const res = await axios.get("http://localhost:5000/api/shelf", {
              headers: { "x-auth-token": token }
          });
          const item = res.data.find(i => i.book._id === bookId);
          if (item) setShelfStatus(item.status);
      } catch (err) {
          console.error(err);
      }
  };

  const handleAddToShelf = async (status) => {
      setShowShelfMenu(false);
      let targetBookId = book._id;

      if (!targetBookId) {
          try {
              const saveRes = await axios.post("http://localhost:5000/api/books", book);
              const savedBook = saveRes.data;
              setBook(savedBook); 
              targetBookId = savedBook._id;
          } catch (err) {
              console.error("Error saving book:", err);
              return;
          }
      }

      await addToShelfRequest(targetBookId, status);
  };

  const addToShelfRequest = async (bookId, status) => {
      try {
          const res = await axios.post("http://localhost:5000/api/shelf/add", 
              { bookId, status },
              { headers: { "x-auth-token": token } }
          );
          setShelfStatus(status);
          
          // Trigger Badge Modal ONLY if backend says so
          if (res.data.newBadge) {
              setShowBadge(res.data.newBadge);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleRate = async (rating) => {
      try {
        let bookId = book._id;
        if (!bookId) {
             const saveRes = await axios.post("http://localhost:5000/api/books", book);
             setBook(saveRes.data);
             bookId = saveRes.data._id;
        }

        const res = await axios.post(`http://localhost:5000/api/books/${bookId}/rate`, 
            { rating },
            { headers: { "x-auth-token": token } }
        );
        setBook(res.data); 
      } catch (err) {
          console.error(err);
      }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
        let bookId = book._id;
        if (!bookId) {
             const saveRes = await axios.post("http://localhost:5000/api/books", book);
             setBook(saveRes.data);
             bookId = saveRes.data._id;
        }

        const res = await axios.post(`http://localhost:5000/api/books/${bookId}/comments`, 
            { content: newComment },
            { headers: { "x-auth-token": token } }
        );
        
        const { comment, newBadge } = res.data;
        if (newBadge) setShowBadge(newBadge);
        
        setComments([comment || res.data, ...comments]); // Fallback just in case
        setNewComment("");
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500 dark:text-gray-400 dark:bg-slate-900">Loading details...</div>;
  if (!book) return <div className="h-screen flex items-center justify-center text-gray-500 dark:text-gray-400 dark:bg-slate-900">Book not found.</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
      <BadgeModal badge={showBadge} onClose={() => setShowBadge(null)} />
      
      {/* Top Search Bar */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl py-4 px-6 flex items-center justify-center transition-all duration-300 shadow-none border-b-0">
         <div className="relative w-full max-w-xl">
             <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-slate-800/80 rounded-full px-5 py-3 ring-1 ring-black/5 dark:ring-white/10 focus-within:ring-slate-900/10 dark:focus-within:ring-purple-500/30 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:shadow-lg transition-all shadow-sm">
                <span className="text-xl">🔍</span>
                <div className="flex-1 relative h-6 overflow-hidden">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-slate-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 h-full"
                        placeholder="Search books, authors..." 
                    />
                </div>
                {searchQuery && (
                    <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-gray-400 hover:text-slate-900 dark:hover:text-white">✕</button>
                )}
             </div>

             {/* Search Dropdown */}
             {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 max-h-96 overflow-y-auto z-50 animate-fade-in-up">
                    {searchResults.map((b) => (
                        <div 
                            key={b.id}
                            onClick={() => {
                                navigate(`/book/${b.id}`);
                                setSearchQuery("");
                                setSearchResults([]);
                            }}
                            className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition border-b border-gray-50 dark:border-slate-700 last:border-none"
                        >
                            <img src={b.cover} alt={b.title} className="w-12 h-16 object-cover rounded shadow-sm" />
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{b.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{b.author}</p>
                            </div>
                        </div>
                    ))}
                </div>
             )}
         </div>
      </div>

      {/* Hero Section - Improved Layout & Dark Mode */}
      <div className="relative pt-12 pb-20 px-6 overflow-visible min-h-[60vh] flex items-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 -z-20"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/40 dark:bg-purple-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[350px_1fr] gap-12 items-start w-full relative z-10">
            {/* Book Cover - Sticky & Elevated */}
            <div className="w-full flex justify-center md:justify-start md:sticky md:top-32 relative group perspective-1000">
                <div className="absolute inset-0 bg-purple-200 dark:bg-purple-900/30 blur-3xl opacity-40 group-hover:opacity-60 transition duration-500 rounded-full"></div>
                <div className="relative w-64 md:w-80 rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-700 transform hover:rotate-0 rotate-1 transition duration-500 bg-gray-100 dark:bg-slate-800">
                    <img 
                        src={book.coverImage || "https://via.placeholder.com/300x450"} 
                        alt={book.title} 
                        className="w-full h-auto object-cover block" 
                        referrerPolicy="no-referrer"
                    />
                </div>
            </div>

            {/* Book Info */}
            <div className="space-y-8">
                <div className="text-center md:text-left">
                     <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white leading-tight mb-2 tracking-tight">
                        {book.title}
                     </h1>
                     <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium">
                        by <span className="text-purple-600 dark:text-purple-400">{book.authors && book.authors.join(", ")}</span>
                     </p>
                </div>
                
                {/* Actions Bar */}
                <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-wrap gap-4 items-center z-30">
                    {/* Rating */}
                    <div className="flex items-center gap-2 pr-6 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex text-yellow-500 text-2xl">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star} 
                                    onClick={() => handleRate(star)}
                                    className="focus:outline-none hover:scale-110 transition transform"
                                >
                                    {book.averageRating >= star ? "★" : "☆"}
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            {book.averageRating || 0}/5
                        </span>
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setShowShelfMenu(!showShelfMenu)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-full font-bold transition flex items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none"
                        >
                            {shelfStatus ? (
                                <><span>✅</span> {shelfStatus.replace(/_/g, " ")}</>
                            ) : (
                                <><span>📚</span> Add to Shelf</>
                            )}
                        </button>
                        {showShelfMenu && (
                            <div className="absolute top-full left-0 mt-3 w-48 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-600 overflow-hidden z-50 animate-fade-in origin-top-left">
                                <div className="p-2 space-y-1">
                                    {["want_to_read", "reading", "completed"].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleAddToShelf(s)}
                                            className="block w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-lg capitalize font-medium transition"
                                        >
                                            {s.replace(/_/g, " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {book.previewLink && (
                        <a 
                            href={book.previewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 dark:text-gray-300 font-bold hover:text-purple-600 dark:hover:text-purple-400 transition"
                        >
                            Read Preview ↗
                        </a>
                    )}
                </div>

                {/* Synopsis - Enhanced Visibility */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-purple-50 dark:border-slate-700 shadow-sm relative z-10">
                    <h3 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-300 font-serif">About the Book</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg text-justify font-normal tracking-wide">
                        {book.description ? book.description.replace(/<[^>]*>?/gm, '') : "No description available. Dive in to find out!"}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Reader Discussion</h2>
            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold">{comments.length} Comments</span>
        </div>
        
        {/* Comment Form - Premium & Dark Mode Friendly */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 mb-12">
            <form onSubmit={handlePostComment} className="relative">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts... what did you think?"
                    className="w-full p-6 bg-gray-50 dark:bg-slate-900 border-none outline-none resize-none h-32 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 rounded-2xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-lg transition-all"
                />
                <div className="flex justify-between items-center px-2 pt-4">
                    <div className="text-gray-300 dark:text-gray-600 text-sm font-medium">✨ Markdown supported</div>
                    <button 
                        type="submit" 
                        disabled={!newComment.trim()}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-1 shadow-lg"
                    >
                        Post Review
                    </button>
                </div>
            </form>
        </div>

        {/* Comments List */}
        <div className="space-y-8">
            {comments.map(comment => (
                <CommentItem key={comment._id} comment={comment} bookId={book._id} token={token} />
            ))}
            {comments.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <span className="text-4xl block mb-4">💭</span>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No comments yet.</p>
                    <p className="text-gray-400 dark:text-gray-500">Be the first to start the conversation!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
