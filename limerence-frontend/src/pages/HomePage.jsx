import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const GenreRow = ({ title, query }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(`/api/books/search?query=${encodeURIComponent(query)}`);
        setBooks(res.data.books || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [query]);

  if (loading) return <div className="h-64 flex items-center justify-center">Loading {title}...</div>;
  if (books.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4 px-4 border-l-4 border-purple-500 ml-4">
        {title}
      </h2>
      <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-hide">
        {books.map((book, index) => (
          <div
            key={index}
            onClick={() => navigate(`/book/${book._id || encodeURIComponent(book.title)}`)}
            className="flex-none w-36 md:w-48 group cursor-pointer"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 mb-2">
              <img
                src={book.coverImage || "https://via.placeholder.com/150"}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
            </div>
            <h3 className="font-bold text-gray-800 text-sm truncate group-hover:text-purple-600 transition">
              {book.title}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {book.authors && book.authors.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("query");
  const [bannerText, setBannerText] = useState("Find Your Next Obsession");
  useEffect(() => {
    const banners = [
      "Find Your Next Obsession",
      "Escape into a Dark Romance",
      "Fall in Love with a Billionaire",
      "Discover Magical Worlds",
      "Unleash Your Inner Reader"
    ];
    
    // Initial random banner
    setBannerText(banners[Math.floor(Math.random() * banners.length)]);

    // Rotate every 5 seconds
    const interval = setInterval(() => {
        setBannerText(prev => {
            const currentIndex = banners.indexOf(prev);
            const nextIndex = (currentIndex + 1) % banners.length;
            return banners[nextIndex];
        });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
       // Update URL to reflect search
       navigate(`/home?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="bg-dream-gradient text-white py-16 px-4 mb-8 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-[1px]"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-md animate-fade-in">
            {bannerText}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
            Dive into stories that make your heart race.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Search for titles, authors, or tropes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-full text-gray-800 shadow-lg focus:ring-4 focus:ring-purple-300 outline-none text-lg"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition w-10 h-10 flex items-center justify-center"
            >
              🔍
            </button>
          </form>
        </div>
      </div>

      {/* Content Rows */}
      <div className="max-w-7xl mx-auto">
        {urlQuery ? (
           <GenreRow title={`Results for: ${urlQuery}`} query={urlQuery} />
        ) : (
          <>
            <GenreRow title="Dark Romance" query="dark romance" />
            <GenreRow title="Trending Now" query="trending books" />
            <GenreRow title="Billionaire Romance" query="billionaire romance" />
            <GenreRow title="Werewolf & Shifter" query="werewolf romance" />
            <GenreRow title="Sports Romance" query="sports romance" />
            <GenreRow title="Enemies to Lovers" query="enemies to lovers" />
            <GenreRow title="Fantasy & Fey" query="fae romance" />
          </>
        )}
      </div>
    </div>
  );
}
