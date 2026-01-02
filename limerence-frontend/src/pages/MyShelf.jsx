import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function MyShelf() {
  const { token } = useContext(AuthContext);
  const [shelf, setShelf] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShelf();
    // eslint-disable-next-line
  }, []);

  const fetchShelf = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/shelf", {
        headers: { "x-auth-token": token },
      });
      setShelf(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const filteredShelf = shelf.filter((item) => 
    filter === "all" ? true : item.status === filter
  );

  // Fallback cover for books without images
  const FALLBACK_COVER = "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=600&q=80";

  if (loading) return <div className="p-8 text-center dark:text-gray-400">Loading shelf...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">My Bookshelf</h1>
        
        {/* Filters */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {["all", "want_to_read", "reading", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full capitalize whitespace-nowrap transition-colors ${
                filter === status
                  ? "bg-primary text-white shadow-md"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredShelf.map((item) => (
            <div key={item._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden">
              <Link to={`/book/${item.book._id}`}>
                <div className="aspect-[2/3] bg-gray-200 dark:bg-slate-700 relative">
                  <img
                    src={item.book.coverImage || FALLBACK_COVER}
                    alt={item.book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = FALLBACK_COVER; }}
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm capitalize font-medium">
                    {item.status.replace(/_/g, " ")}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">{item.book.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {item.book.authors && item.book.authors.join(", ")}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {filteredShelf.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-xl">No books found in this list.</p>
            <Link to="/home" className="text-primary hover:underline mt-2 inline-block">
              Discover new books
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
