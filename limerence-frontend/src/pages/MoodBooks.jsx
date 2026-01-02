import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MOODS } from "./Moods";

export default function MoodBooks() {
  const { moodId } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const mood = MOODS.find(m => m.id === moodId);

  useEffect(() => {
    if (mood) {
      fetchBooks();
    } else {
      setLoading(false);
    }
  }, [moodId, mood]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use simpler search query for better results
      const searchQuery = mood.searchTerm || mood.label;
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=40`;
      
      console.log("Fetching from:", url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("API error");
      
      const data = await response.json();
      console.log("Got data:", data.numFound, "books");
      
      if (data.docs && data.docs.length > 0) {
        const results = data.docs
          .filter(doc => doc.cover_i) // Only books with covers
          .slice(0, 30) // Limit to 30
          .map(doc => ({
            id: doc.key?.replace('/works/', '') || `book-${Math.random()}`,
            title: doc.title,
            author: doc.author_name?.[0] || 'Unknown Author',
            cover: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
            year: doc.first_publish_year || '',
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
          }));
        
        setBooks(results);
      } else {
        setBooks([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mood) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-2xl font-bold mb-4">Mood not found</p>
          <button onClick={() => navigate('/moods')} className="px-6 py-3 bg-purple-500 rounded-full font-bold">
            ← Back to Moods
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 pb-20 transition-colors duration-300">
      {/* Header with mood color - extends into navbar area */}
      <div className={`${mood.color} text-white pt-24 pb-8 px-4`}>
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate('/moods')} 
            className="mb-4 text-white/70 hover:text-white transition flex items-center gap-2 text-sm"
          >
            ← Back to Moods
          </button>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{mood.emoji}</span>
            <div>
              <h1 className="text-4xl font-serif font-bold">{mood.label}</h1>
              <p className="text-white/70 mt-1">
                {loading ? 'Searching...' : books.length > 0 ? `${books.length} books found` : 'No books found'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4 text-lg">Finding {mood.label} books...</p>
            <p className="text-gray-500 text-sm mt-2">Searching OpenLibrary...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-6xl block mb-4">⚠️</span>
            <p className="text-xl font-bold text-red-400">Failed to load books</p>
            <p className="mt-2">{error}</p>
            <button onClick={fetchBooks} className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-full">
              Try Again
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-6xl block mb-4">�</span>
            <p className="text-xl font-bold">No books found for "{mood.label}"</p>
            <p className="mt-2">Try a different mood!</p>
            <button onClick={() => navigate('/moods')} className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-full">
              Browse Moods
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {books.map((book) => (
              <Link
                key={book.id}
                to={`/book/${encodeURIComponent(book.title)}`}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300 bg-slate-700">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/200x300/1e293b/94a3b8?text=No+Cover';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      ⭐ {book.rating}
                    </div>
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <h3 className="font-bold text-white text-sm truncate group-hover:text-purple-400 transition">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
