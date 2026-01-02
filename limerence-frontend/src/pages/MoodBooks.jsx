import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MOODS } from "./Moods";
import axios from "axios";

export default function MoodBooks() {
  const { moodId } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const mood = MOODS.find(m => m.id === moodId);

  useEffect(() => {
    if (mood) {
      fetchBooks();
    }
  }, [moodId]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Fetch from OpenLibrary with the mood's search term
      const res = await axios.get(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(mood.searchTerm)}&limit=30`
      );
      
      const results = res.data.docs
        .filter(doc => doc.cover_i) // Only books with covers
        .map(doc => ({
          id: doc.key?.replace('/works/', '') || doc.edition_key?.[0] || Math.random(),
          title: doc.title,
          author: doc.author_name?.[0] || 'Unknown',
          cover: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
          coverLarge: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          year: doc.first_publish_year || '',
          rating: (Math.random() * 2 + 3).toFixed(1), // Simulated rating
        }));
      
      setBooks(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mood) {
    return (
      <div className="min-h-screen bg-slate-900 pt-20 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-900 pt-20 pb-20 transition-colors duration-300">
      {/* Header with mood color */}
      <div className={`${mood.color} text-white py-10 px-4`}>
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate('/moods')} 
            className="mb-4 text-white/70 hover:text-white transition flex items-center gap-2"
          >
            ← Back to Moods
          </button>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{mood.emoji}</span>
            <div>
              <h1 className="text-4xl font-serif font-bold">{mood.label}</h1>
              <p className="text-white/70 mt-1">
                {books.length > 0 ? `${books.length} books found` : 'Finding your perfect reads...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Finding {mood.label} books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-6xl block mb-4">😢</span>
            <p className="text-xl font-bold">No books found for this mood</p>
            <p className="mt-2">Try another mood!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {books.map((book) => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300 bg-slate-800">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/200x300?text=No+Cover'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex items-center gap-1 text-yellow-400 text-sm mb-1">
                      ⭐ {book.rating}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
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
