import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function BookDetails() {
  const { title } = useParams(); // Note: Route uses :title but we might need ID. 
  // If we clicked from Home (scraped), we might pass data via state or fetch by title?
  // Ideally we use ID. Let's assume we fixed the route to use :id or handle both.
  // For now, let's assume the ID is passed in the URL.
  
  const { token } = useContext(AuthContext);

  // const navigate = useNavigate(); // Unused
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [shelfStatus, setShelfStatus] = useState(null);

  // Check if title is an ID (24 hex chars)
  const isId = /^[0-9a-fA-F]{24}$/.test(title);

  useEffect(() => {
    fetchBookDetails();
    // eslint-disable-next-line
  }, [title]);

  const fetchBookDetails = async () => {
    try {
      let bookData;
      if (isId) {
        const res = await axios.get(`http://localhost:5000/api/books/${title}`);
        bookData = res.data;
      } else {
        // Search by title if not ID (fallback for legacy links)
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
      if (!book._id) {
          // If book is from scraper (no _id), save it first!
          try {
              const saveRes = await axios.post("http://localhost:5000/api/books", book);
              const savedBook = saveRes.data;
              setBook(savedBook); // Update local state with saved book (has _id)
              
              // Now add to shelf
              await addToShelfRequest(savedBook._id, status);
          } catch (err) {
              console.error("Error saving book:", err);
          }
      } else {
          await addToShelfRequest(book._id, status);
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
        setBook(res.data); // Update book with new rating
      } catch (err) {
          console.error(err);
      }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
        // Ensure book is saved
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

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!book) return <div className="p-8 text-center">Book not found.</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 md:w-64 flex-shrink-0 shadow-2xl mx-auto md:mx-0">
                <img src={book.coverImage} alt={book.title} className="w-full rounded-lg" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold mb-2">{book.title}</h1>
                <p className="text-xl text-gray-300 mb-6">by {book.authors && book.authors.join(", ")}</p>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-8">
                    {book.downloadUrl && (
                        <div className="flex gap-4">
                            <a 
                                href={book.downloadUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-primary hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition shadow-lg flex items-center gap-2"
                            >
                                <span>⬇️</span> Download PDF
                            </a>
                            <a 
                                href={book.downloadUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold transition shadow-lg hover:bg-gray-100 flex items-center gap-2"
                            >
                                <span>📖</span> Read Online
                            </a>
                        </div>
                    )}
                    
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 text-yellow-400 text-2xl my-4">
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
                    
                    <div className="relative group">
                        <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition backdrop-blur-sm">
                            {shelfStatus ? `Status: ${shelfStatus.replace(/_/g, " ")}` : "Add to Shelf"}
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-10">
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
                    </div>
                </div>

                <p className="text-gray-300 leading-relaxed max-w-2xl">{book.description}</p>
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
                <div key={comment._id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {comment.user.avatar ? (
                            <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-500 font-bold">{comment.user.name[0]}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{comment.user.name}</span>
                            <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                    </div>
                </div>
            ))}
            {comments.length === 0 && (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
            )}
        </div>
      </div>
    </div>
  );
}
