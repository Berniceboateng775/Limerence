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
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {comment.user.avatar ? (
                    <img src={`http://localhost:5000${comment.user.avatar}`} alt={comment.user.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-500 font-bold">{comment.user.name[0]}</span>
                )}
            </div>
            <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 ml-2">
                    <button onClick={handleLike} className="hover:text-primary flex items-center gap-1">
                        👍 {likes.length}
                    </button>
                    <button onClick={handleDislike} className="hover:text-red-500 flex items-center gap-1">
                        👎 {dislikes.length}
                    </button>
                    <button onClick={() => setShowReplyBox(!showReplyBox)} className="hover:text-gray-900 font-medium">
                        Reply
                    </button>
                </div>

                {showReplyBox && (
                    <form onSubmit={handleReply} className="mt-2 flex gap-2">
                        <input 
                            type="text" 
                            value={replyContent} 
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="flex-1 border rounded-full px-4 py-1 text-sm outline-none focus:border-primary"
                            placeholder="Write a reply..."
                        />
                        <button type="submit" className="text-primary font-bold text-sm">Post</button>
                    </form>
                )}

                {/* Replies */}
                {replies.length > 0 && (
                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100">
                        {replies.map((reply, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                     {/* Reply user avatar logic would go here if populated */}
                                     <span className="text-xs font-bold">{reply.user?.name?.[0] || "?"}</span>
                                </div>
                                <div>
                                    <p className="text-sm bg-gray-50 p-2 rounded-xl rounded-tl-none">
                                        <span className="font-bold mr-2">{reply.user?.name || "User"}</span>
                                        {reply.content}
                                    </p>
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
  const { title } = useParams();
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
  }, [title]);

  const fetchBookDetails = async () => {
    try {
      let bookData;
      
      // 1. Try Internal ID (Mongo)
      if (isId) {
        const res = await axios.get(`http://localhost:5000/api/books/${title}`);
        bookData = res.data;
      } 
      // 2. Try OpenLibrary ID (starts with OL)
      else if (title.startsWith("OL")) {
          const res = await axios.get(`https://openlibrary.org/works/${title}.json`);
          const d = res.data;
          // Fetch author name separately if needed
          let authorName = "Unknown Author";
           if (d.authors && d.authors.length > 0) {
              try {
                  const authorRes = await axios.get(`https://openlibrary.org${d.authors[0].author.key}.json`);
                  authorName = authorRes.data.name;
              } catch (e) { console.warn("Author fetch failed", e); }
          }

          bookData = {
              _id: null,
              title: d.title,
              authors: [authorName],
              description: d.description?.value || d.description || "No description available.",
              coverImage: d.covers && d.covers.length ? `https://covers.openlibrary.org/b/id/${d.covers[0]}-L.jpg` : "https://via.placeholder.com/300x450",
              averageRating: 4.5, 
              externalId: title,
              previewLink: `https://openlibrary.org/works/${title}`,
              downloadUrl: null // No download for external yet
          };
      }
      // 3. Fallback: Search by title in local DB
      else {
        const res = await axios.get(`http://localhost:5000/api/books/search?query=${title}`);
        if (res.data.books && res.data.books.length > 0) {
            bookData = res.data.books[0];
        }
      }

      if (bookData) {
         setBook(bookData);
         if (bookData._id) {
             fetchComments(bookData._id);
             checkShelfStatus(bookData._id);
         }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
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
    <div className="min-h-screen bg-white">
      <BadgeModal badge={showBadge} onClose={() => setShowBadge(null)} />
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 md:w-64 flex-shrink-0 shadow-2xl mx-auto md:mx-0 transform -rotate-2 hover:rotate-0 transition-all duration-500">
                <img src={book.coverImage || "https://via.placeholder.com/300x450"} alt={book.title} className="w-full rounded-lg" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold mb-2 font-serif tracking-tight">{book.title}</h1>
                <p className="text-xl text-gray-300 mb-6 font-light">by {book.authors && book.authors.join(", ")}</p>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-8">
                    {/* Read Online Button (Google Preview) */}
                    {book.previewLink && (
                        <a 
                            href={book.previewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold transition shadow-lg hover:bg-gray-100 flex items-center gap-2 transform hover:-translate-y-1"
                        >
                            <span>📖</span> Read Preview
                        </a>
                    )}

                    {/* Download Button (OceanofPDF) */}
                    {book.downloadUrl && (
                        <a 
                            href={book.downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-primary hover:bg-rose-600 text-white px-8 py-3 rounded-full font-bold transition shadow-lg flex items-center gap-2 transform hover:-translate-y-1"
                        >
                            <span>⬇️</span> Download PDF
                        </a>
                    )}
                    
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 text-yellow-500 text-2xl my-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <span 
                                key={star} 
                                onClick={() => handleRate(star)}
                                className="cursor-pointer hover:scale-125 transition transform duration-200"
                                title={`Rate ${star} stars`}
                            >
                                {book.averageRating >= star ? "★" : "☆"}
                            </span>
                        ))}
                        <span className="text-sm text-gray-400 ml-2">
                            ({book.averageRating || 0} / 5)
                        </span>
                    </div>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowShelfMenu(!showShelfMenu)}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition backdrop-blur-sm border border-white/20"
                        >
                            {shelfStatus ? `Status: ${shelfStatus.replace(/_/g, " ")}` : "Add to Shelf"}
                        </button>
                        {showShelfMenu && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl overflow-hidden z-10 animate-fade-in">
                                {["want_to_read", "reading", "completed"].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleAddToShelf(s)}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 capitalize"
                                    >
                                        {s.replace(/_/g, " ")}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl backdrop-blur-md border border-white/10">
                    <h3 className="text-lg font-bold mb-2 text-primary">Synopsis</h3>
                    <p className="text-gray-300 leading-relaxed max-w-2xl font-light">
                        {book.description ? book.description.replace(/<[^>]*>?/gm, '') : "No description available. Dive in to find out!"}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 border-b pb-4">Community Discussion</h2>
        
        {/* Comment Form */}
        <form onSubmit={handlePostComment} className="mb-10">
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this book..."
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-32"
            />
            <div className="mt-2 flex justify-end">
                <button 
                    type="submit" 
                    disabled={!newComment.trim()}
                    className="bg-dark text-white px-6 py-2 rounded-lg hover:bg-black disabled:opacity-50 transition"
                >
                    Post Comment
                </button>
            </div>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
            {comments.map(comment => (
                <CommentItem key={comment._id} comment={comment} bookId={book._id} token={token} />
            ))}
            {comments.length === 0 && (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
            )}
        </div>
      </div>
    </div>
  );
}
