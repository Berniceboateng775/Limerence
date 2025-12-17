import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import BadgeModal from "../components/BadgeModal";

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
                <div className="bg-white p-5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 relative hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900">{comment.user.name}</span>
                        <span className="text-xs text-gray-400">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">{comment.content}</p>
                </div>
                
                <div className="flex items-center gap-6 mt-2 text-xs font-bold text-gray-400 ml-2">
                    <button onClick={handleLike} className="hover:text-purple-600 flex items-center gap-1 transition-colors">
                        👍 {likes.length || "Like"}
                    </button>
                    <button onClick={handleDislike} className="hover:text-red-500 flex items-center gap-1 transition-colors">
                        👎 {dislikes.length || "Dislike"}
                    </button>
                    <button onClick={() => setShowReplyBox(!showReplyBox)} className="hover:text-slate-900 transition-colors">
                        Reply
                    </button>
                </div>

                {showReplyBox && (
                    <form onSubmit={handleReply} className="mt-4 flex gap-3 animate-fade-in-up">
                        <input 
                            type="text" 
                            value={replyContent} 
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="flex-1 bg-gray-50 border-none rounded-full px-5 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 transition"
                            placeholder="Write a reply..."
                        />
                        <button type="submit" className="text-purple-600 font-bold text-sm px-3 hover:bg-purple-50 rounded-full transition">Post</button>
                    </form>
                )}

                {/* Replies */}
                {replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 md:pl-6 border-l-2 border-purple-50">
                        {replies.map((reply, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-gray-500">
                                     <span className="text-xs font-bold">{reply.user?.name?.[0] || "?"}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gray-50 p-3 rounded-xl rounded-tl-sm text-sm text-gray-700">
                                        <span className="font-bold text-slate-900 mr-2">{reply.user?.name || "User"}</span>
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
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [shelfStatus, setShelfStatus] = useState(null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [showBadge, setShowBadge] = useState(null);

  // Check if title is an ID (24 hex chars)
  const isId = /^[0-9a-fA-F]{24}$/.test(title);

  useEffect(() => {
    fetchBookDetails();
    // eslint-disable-next-line
  }, [title, id]);

  const fetchBookDetails = async () => {
    try {
      // Robust Param Extraction: Check both 'title' and 'id' in case route definition varies
      const routeTitle = title || id; 
      if (!routeTitle) {
          console.error("No book identifier found in URL params");
          setLoading(false);
          return;
      }

      let bookData = null;
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(routeTitle);

      // 1. Internal MongoDB ID
      if (isMongoId) {
        try {
            const res = await axios.get(`http://localhost:5000/api/books/${routeTitle}`);
            bookData = res.data;
        } catch (e) { console.warn("Internal ID fetch failed"); }
      } 
      
      // 2. OpenLibrary ID (Direct Fetch)
      else if (routeTitle.startsWith("OL")) {
          try {
              // Use native fetch to avoid any axios interceptor/config issues with external URLs
              const res = await fetch(`https://openlibrary.org/works/${routeTitle}.json`);
              if (res.ok) {
                  const d = await res.json();
                  
                  let authorName = "Unknown Author";
                  if (d.authors && d.authors.length > 0) {
                      try {
                          const authRes = await fetch(`https://openlibrary.org${d.authors[0].author.key}.json`);
                          if (authRes.ok) {
                              const authData = await authRes.json();
                              authorName = authData.name;
                          }
                      } catch (e) { /* ignore */ }
                  }

                  bookData = {
                      _id: null,
                      title: d.title,
                      authors: [authorName],
                      description: (typeof d.description === 'string' ? d.description : d.description?.value) || "No description available.",
                      coverImage: d.covers && d.covers.length ? `https://covers.openlibrary.org/b/id/${d.covers[0]}-L.jpg` : "https://via.placeholder.com/300x450",
                      averageRating: 4.5, 
                      externalId: routeTitle,
                      previewLink: `https://openlibrary.org/works/${routeTitle}`,
                      downloadUrl: null 
                  };
              }
          } catch (err) {
              console.warn("Direct ID fetch failed, continuing to fallback...", err);
          }
      }

      // 3. Fallback: Search by Identifier (Title or ID)
      if (!bookData) {
        // A. Local DB Search
        try {
            const res = await axios.get(`http://localhost:5000/api/books/search?query=${routeTitle}`);
            if (res.data.books && res.data.books.length > 0) {
                bookData = res.data.books[0];
            }
        } catch (e) { console.warn("Local search failed", e); }

        // B. OpenLibrary Search (The Ultimate Safety Net)
        if (!bookData) {
            try {
                // Search by query 'q' finds both Titles and IDs
                const olSearchRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(routeTitle)}&limit=1`);
                if (olSearchRes.ok) {
                    const searchData = await olSearchRes.json();
                    if (searchData.docs && searchData.docs.length > 0) {
                        const d = searchData.docs[0];
                        
                        // Try to get fuller details (Description)
                        let fullDesc = "No description available.";
                        try {
                            const workRes = await fetch(`https://openlibrary.org${d.key}.json`);
                            if (workRes.ok) {
                                const workD = await workRes.json();
                                fullDesc = (typeof workD.description === 'string' ? workD.description : workD.description?.value) || fullDesc;
                            }
                        } catch (e) { /* use default desc */ }

                        bookData = {
                            _id: null,
                            title: d.title,
                            authors: d.author_name || ["Unknown"],
                            description: fullDesc,
                            coverImage: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : "https://via.placeholder.com/300x450",
                            averageRating: d.ratings_average ? Number(d.ratings_average.toFixed(1)) : 4.5,
                            externalId: d.key?.replace("/works/", "") || routeTitle
                        };
                    }
                }
            } catch (e) { console.warn("OL Fallback search failed", e); }
        }
      }

      setBook(bookData); 
      // Only fetch comments/shelf if we actually found a Mongo ID (bookData._id exists)
      // For external books, we can save them to DB triggers lazily on interaction (like in handleRate/handleAddToShelf)
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
      if (!book._id) {
          try {
              const saveRes = await axios.post("http://localhost:5000/api/books", book);
              const savedBook = saveRes.data;
              setBook(savedBook); 
              await addToShelfRequest(savedBook._id, status);
          } catch (err) {
              console.error("Error saving book:", err);
          }
      } else {
          await addToShelfRequest(book._id, status);
      }

      if (status === "completed") {
          setShowBadge({
              name: "Bookworm",
              description: "You've completed a book! Keep reading to earn more.",
              icon: "📚"
          });
      }
  };

  const addToShelfRequest = async (bookId, status) => {
      try {
          await axios.post("http://localhost:5000/api/shelf/add", 
              { bookId, status },
              { headers: { "x-auth-token": token } }
          );
          setShelfStatus(status);
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
        setComments([res.data, ...comments]);
        setNewComment("");
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Loading details...</div>;
  if (!book) return <div className="h-screen flex items-center justify-center text-gray-500">Book not found.</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <BadgeModal badge={showBadge} onClose={() => setShowBadge(null)} />
      
      {/* Hero Section - Gradient Theme */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 -z-20"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10"></div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-start relative z-10">
            {/* Book Cover */}
            <div className="w-56 md:w-80 flex-shrink-0 mx-auto md:mx-0 relative perspective-1000 group">
                <div className="absolute inset-0 bg-purple-200 blur-2xl opacity-40 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white transform hover:rotate-0 rotate-2 transition duration-500 bg-gray-100">
                    <img 
                        src={book.coverImage || "https://via.placeholder.com/300x450"} 
                        alt={book.title} 
                        className="w-full h-auto object-cover block" 
                        referrerPolicy="no-referrer"
                    />
                </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 text-center md:text-left space-y-6">
                <div>
                     <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-tight mb-2 tracking-tight">
                        {book.title}
                     </h1>
                     <p className="text-xl md:text-2xl text-gray-500 font-medium">
                        by <span className="text-purple-600">{book.authors && book.authors.join(", ")}</span>
                     </p>
                </div>
                
                {/* Rating */}
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <div className="flex text-yellow-500 text-2xl">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button 
                                key={star} 
                                onClick={() => handleRate(star)}
                                className="focus:outline-none hover:scale-125 transition transform"
                            >
                                {book.averageRating >= star ? "★" : "☆"}
                            </button>
                        ))}
                    </div>
                    <span className="text-sm font-bold text-gray-400 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                        {book.averageRating || 0} / 5
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                    {book.previewLink && (
                        <a 
                            href={book.previewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-slate-800 hover:-translate-y-1 transition flex items-center gap-2"
                        >
                            <span>📖</span> Read Preview
                        </a>
                    )}

                    {book.downloadUrl && (
                        <a 
                            href={book.downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-slate-900 border border-gray-200 px-8 py-3.5 rounded-full font-bold shadow-sm hover:bg-gray-50 hover:-translate-y-1 transition flex items-center gap-2"
                        >
                            <span>⬇️</span> Download PDF
                        </a>
                    )}
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowShelfMenu(!showShelfMenu)}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-6 py-3.5 rounded-full font-bold transition flex items-center gap-2"
                        >
                            {shelfStatus ? (
                                <><span>✅</span> {shelfStatus.replace(/_/g, " ")}</>
                            ) : (
                                <><span>📚</span> Add to Shelf</>
                            )}
                        </button>
                        {showShelfMenu && (
                            <div className="absolute top-full left-0 mt-3 w-56 bg-white text-gray-800 rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-fade-in origin-top-left">
                                <div className="p-2 space-y-1">
                                    {["want_to_read", "reading", "completed"].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleAddToShelf(s)}
                                            className="block w-full text-left px-4 py-2.5 hover:bg-purple-50 rounded-xl capitalize font-medium transition"
                                        >
                                            {s.replace(/_/g, " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Synopsis */}
                <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-purple-100 shadow-sm mt-8">
                    <h3 className="text-lg font-bold mb-4 text-purple-900 font-serif">Synopsis</h3>
                    <p className="text-gray-600 leading-relaxed font-light text-lg">
                        {book.description ? book.description.replace(/<[^>]*>?/gm, '') : "No description available. Dive in to find out!"}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-serif font-bold text-slate-900">Reader Discussion</h2>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">{comments.length} Comments</span>
        </div>
        
        {/* Comment Form */}
        <div className="bg-white p-2 rounded-3xl shadow-lg border border-gray-100 mb-12">
            <form onSubmit={handlePostComment} className="relative">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts... what did you think?"
                    className="w-full p-6 bg-transparent border-none outline-none resize-none h-32 focus:ring-0 text-gray-700 placeholder-gray-400 text-lg"
                />
                <div className="flex justify-between items-center px-6 pb-4 border-t border-gray-50 pt-3">
                    <div className="text-gray-300 text-sm font-medium">Formatting supported</div>
                    <button 
                        type="submit" 
                        disabled={!newComment.trim()}
                        className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-1"
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
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <span className="text-4xl block mb-4">💭</span>
                    <p className="text-gray-500 font-medium text-lg">No comments yet.</p>
                    <p className="text-gray-400">Be the first to start the conversation!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
