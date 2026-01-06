import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function UserBooksPage() {
  const { id } = useParams(); // Optional: view another user's books
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useContext(AuthContext);
  
  const [activeFilter, setActiveFilter] = useState(searchParams.get("status") || "all");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const userId = id || currentUser?._id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?._id || id === currentUser?.id;

  useEffect(() => {
    fetchUserBooks();
  }, [userId]);

  useEffect(() => {
    setActiveFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  const fetchUserBooks = async () => {
    try {
      setLoading(true);
      
      // Get profile info with shelf
      const profileRes = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: { "x-auth-token": token },
      });
      setProfileName(profileRes.data.name || profileRes.data.username);
      
      const shelf = profileRes.data.shelf || [];
      setBooks(shelf);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    setSearchParams({ status: filter });
  };

  const getFilteredBooks = () => {
    if (activeFilter === "all") return books;
    return books.filter(item => item.status === activeFilter);
  };

  const addToMyShelf = async (book, status) => {
    setActionLoading(book._id || book.id);
    try {
      await axios.post("http://localhost:5000/api/shelf/add", {
        bookId: book.id || book._id,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage,
        status: status
      }, {
        headers: { "x-auth-token": token },
      });
      alert(`Added "${book.title}" to your shelf as "${status.replace('_', ' ')}"`);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to add book");
    }
    setActionLoading(null);
  };

  const searchByAuthor = (authorName) => {
    navigate(`/home?search=${encodeURIComponent(authorName)}`);
  };

  const filteredBooks = getFilteredBooks();

  const STATUS_LABELS = {
    want_to_read: "Want to Read",
    reading: "Currently Reading",
    completed: "Completed",
  };

  const FILTER_TABS = [
    { id: "all", label: "All Books", icon: "📚" },
    { id: "reading", label: "Reading", icon: "📖" },
    { id: "want_to_read", label: "Want to Read", icon: "📋" },
    { id: "completed", label: "Completed", icon: "✅" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center pt-24">
        <div className="animate-pulse text-gray-500">Loading books...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-16 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(isOwnProfile ? "/profile" : `/user/${id}`)} className="text-gray-500 hover:text-purple-600">
            ← Back to Profile
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isOwnProfile ? "Your Books" : `${profileName}'s Books`}
          </h1>
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-bold">
            {books.length} books
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => changeFilter(tab.id)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
              <span className="ml-2 opacity-75">
                ({tab.id === "all" ? books.length : books.filter(b => b.status === tab.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Books Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredBooks.map((item, i) => (
                <div 
                  key={i}
                  className="group relative bg-gray-50 dark:bg-slate-700 rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                >
                  {/* Book Cover */}
                  <div 
                    onClick={() => navigate(`/book/${encodeURIComponent(item.book?.title || item.title || 'Unknown')}`)}
                    className="aspect-[2/3] bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer overflow-hidden"
                  >
                    {(item.book?.coverImage || item.coverImage) ? (
                      <img 
                        src={item.book?.coverImage || item.coverImage}
                        alt={item.book?.title || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://covers.openlibrary.org/b/title/${encodeURIComponent(item.book?.title || item.title || 'book')}-M.jpg`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                        📚
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        item.status === "completed" ? "bg-green-500 text-white" :
                        item.status === "reading" ? "bg-blue-500 text-white" :
                        "bg-yellow-500 text-white"
                      }`}>
                        {item.status === "completed" ? "✅" : item.status === "reading" ? "📖" : "📋"}
                      </span>
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="p-3">
                    <p 
                      className="font-bold text-gray-900 dark:text-white text-sm truncate cursor-pointer hover:text-purple-600"
                      onClick={() => navigate(`/book/${encodeURIComponent(item.book?.title || item.title || 'Unknown')}`)}
                    >
                      {item.book?.title || item.title || "Unknown Title"}
                    </p>
                    <p 
                      className="text-xs text-gray-500 truncate cursor-pointer hover:text-purple-500"
                      onClick={() => searchByAuthor(item.book?.author || item.author || "Unknown")}
                    >
                      by {item.book?.author || item.author || "Unknown Author"}
                    </p>
                    
                    {/* Progress for reading */}
                    {item.status === "reading" && item.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                          <div 
                            className="bg-purple-500 h-1.5 rounded-full" 
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{item.progress}%</p>
                      </div>
                    )}

                    {/* Add to My Shelf (for visitors) */}
                    {!isOwnProfile && (
                      <div className="mt-2 relative group/add">
                        <button
                          disabled={actionLoading === (item.book?._id || item._id)}
                          className="w-full bg-purple-600 text-white text-xs py-1.5 rounded-lg hover:bg-purple-700 transition font-bold disabled:opacity-50"
                        >
                          {actionLoading === (item.book?._id || item._id) ? "Adding..." : "+ Add to My Shelf"}
                        </button>
                        <div className="absolute bottom-full left-0 right-0 mb-1 hidden group-hover/add:block z-10">
                          <div className="bg-white dark:bg-slate-600 rounded-lg shadow-lg border border-gray-200 dark:border-slate-500 overflow-hidden">
                            {["want_to_read", "reading", "completed"].map(status => (
                              <button
                                key={status}
                                onClick={() => addToMyShelf(item.book || item, status)}
                                className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-200"
                              >
                                {STATUS_LABELS[status]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                {activeFilter === "all" 
                  ? "No books on shelf yet" 
                  : `No ${STATUS_LABELS[activeFilter]?.toLowerCase() || activeFilter} books`}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {isOwnProfile ? "Start adding books from the search!" : "This reader hasn't added any books yet."}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-center text-white">
            <div className="text-2xl font-bold">{books.filter(b => b.status === "reading").length}</div>
            <div className="text-xs opacity-90">Currently Reading</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-4 text-center text-white">
            <div className="text-2xl font-bold">{books.filter(b => b.status === "want_to_read").length}</div>
            <div className="text-xs opacity-90">Want to Read</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-center text-white">
            <div className="text-2xl font-bold">{books.filter(b => b.status === "completed").length}</div>
            <div className="text-xs opacity-90">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
