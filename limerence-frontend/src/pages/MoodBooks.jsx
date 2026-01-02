import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MOODS } from "./Moods";

export default function MoodBooks() {
  const { moodId } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const mood = MOODS.find(m => m.id === moodId);
  const BOOKS_PER_PAGE = 50;

  // Helper functions from HomePage
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const toCover = (item) => {
    if (item.cover_i) return `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`;
    if (item.cover_id) return `https://covers.openlibrary.org/b/id/${item.cover_id}-M.jpg`;
    return null;
  };

  const mapWork = (w) => ({
    id: (w.key || w.title || Math.random()).toString().replace("/works/", ""),
    title: w.title,
    author: w.author_name?.[0] || w.authors?.[0]?.name || "Unknown",
    cover: toCover(w),
    rating: w.ratings_average ? Number(w.ratings_average.toFixed(1)) : (3.5 + Math.random() * 1.5).toFixed(1)
  });

  useEffect(() => {
    if (mood) {
      setBooks([]);
      setPage(0);
      setHasMore(true);
      fetchBooks(0, true);
    }
  }, [moodId]);

  const fetchBooks = async (pageNum = 0, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const offset = pageNum * BOOKS_PER_PAGE;
      
      // Use same approach as HomePage
      let url;
      if (mood.type === 'subject') {
        url = `https://openlibrary.org/search.json?subject=${mood.query}&limit=${BOOKS_PER_PAGE}&offset=${offset}&fields=title,cover_i,author_name,key,ratings_average`;
      } else {
        url = `https://openlibrary.org/search.json?q=${encodeURIComponent(mood.query)}&limit=${BOOKS_PER_PAGE}&offset=${offset}&fields=title,cover_i,author_name,key,ratings_average`;
      }
      
      console.log("Fetching:", url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      let newBooks = (data.docs || []).map(mapWork).filter(b => b.cover);
      
      if (newBooks.length > 0) {
        newBooks = shuffle(newBooks);
        
        if (reset) {
          setBooks(newBooks);
        } else {
          setBooks(prev => [...prev, ...newBooks]);
        }
        
        setHasMore(newBooks.length >= 20);
        setPage(pageNum);
      } else {
        if (reset) setBooks([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error:", err);
      if (reset) setBooks([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchBooks(page + 1, false);
    }
  };

  if (!mood) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800 dark:text-white mb-4">Mood not found</p>
          <button onClick={() => navigate('/moods')} className="px-5 py-2 bg-purple-600 text-white rounded-full text-sm font-bold">
            ← Back to Moods
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24 transition-colors duration-300">
      {/* Header - matches Moods page style */}
      <div className="bg-slate-900 text-white py-8 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate('/moods')} 
            className="text-slate-400 hover:text-white transition text-sm mb-3"
          >
            ← Back to Moods
          </button>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{mood.emoji}</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold">{mood.label}</h1>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Finding {mood.label} books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📚</span>
            <p className="text-lg font-bold text-gray-800 dark:text-white">No books found</p>
            <button onClick={() => navigate('/moods')} className="mt-4 px-5 py-2 bg-purple-600 text-white rounded-full text-sm">
              Try another mood
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {books.map((book, index) => (
                <Link
                  key={`${book.id}-${index}`}
                  to={`/book/${encodeURIComponent(book.title)}`}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 bg-gray-200 dark:bg-slate-800">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150x220/e2e8f0/94a3b8?text=No+Cover';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                      <span className="text-yellow-400 text-xs">⭐ {book.rating}</span>
                    </div>
                  </div>
                  <div className="mt-2 px-0.5">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Loading...
                    </span>
                  ) : (
                    'Load More Books'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
