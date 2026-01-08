import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "../components/Toast";

export default function Profile() {
  const navigate = useNavigate();
  const { token, logout, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", avatar: "", about: "" });
  const [activeTab, setActiveTab] = useState("books");
  const [activeNetworkTab, setActiveNetworkTab] = useState("followers");
  const [showSummary, setShowSummary] = useState(false);
  const [activeBookStatus, setActiveBookStatus] = useState("want_to_read");
  
  // Tab data states
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [reviews, setReviews] = useState([]); // Popular reviews
  const [clubFilter, setClubFilter] = useState("all");
  const [unfollowTargetId, setUnfollowTargetId] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?._id) {
      fetchStats();
      fetchClubs();
      fetchFollowers();
      fetchClubs();
      fetchFollowers();
      fetchFollowing();
      fetchReviews();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { "x-auth-token": token },
      });
      setProfile(res.data);
      setEditForm({ 
        name: res.data.name, 
        email: res.data.email,
        avatar: res.data.avatar || "",
        about: res.data.about || "" 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${profile._id}/stats`, {
        headers: { "x-auth-token": token },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${profile._id}/clubs`, {
        headers: { "x-auth-token": token },
      });
      setClubs(res.data.clubs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${profile._id}/followers`, {
        headers: { "x-auth-token": token },
      });
      setFollowers(res.data.followers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${profile._id}/following`, {
        headers: { "x-auth-token": token },
      });
      setFollowing(res.data.following || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${profile._id}/reviews`, {
        headers: { "x-auth-token": token },
      });
      setReviews(res.data.reviews || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfollowClick = (targetId) => {
    setUnfollowTargetId(targetId);
  };

  const confirmUnfollow = async () => {
    if (!unfollowTargetId) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/follow/${unfollowTargetId}`, {
        headers: { "x-auth-token": token },
      });
      setFollowing(prev => prev.filter(u => u._id !== unfollowTargetId));
      fetchStats();
      toast("Unfollowed successfully!");
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.msg || "Action failed", "error");
    }
    setUnfollowTargetId(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("about", editForm.about || "");
      if (editForm.avatarFile) {
        formData.append("avatar", editForm.avatarFile);
      }

      const res = await axios.put("http://localhost:5000/api/auth/me", formData, {
        headers: { 
          "x-auth-token": token,
          "Content-Type": "multipart/form-data"
        },
      });
      setProfile(res.data);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.replace("/");
  };

  if (!profile) return (
    <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  );

  const badges = profile.badges || [];
  const shelf = profile.shelf || [];
  const booksReading = shelf.filter(b => b.status === "reading");
  const booksCompleted = shelf.filter(b => b.status === "completed");
  const booksWantToRead = shelf.filter(b => b.status === "want_to_read");

  const filteredClubs = clubFilter === "all" 
    ? clubs 
    : clubFilter === "admin" 
      ? clubs.filter(c => c.isAdmin) 
      : clubs.filter(c => !c.isAdmin);

  const TABS = [
    { id: "books", label: "📚 Books", count: shelf.length },
    { id: "stats", label: "📊 Stats", count: null },
    { id: "reviews", label: "✍️ Reviews", count: reviews.length }, // Use actual reviews count
    { id: "goals", label: "🎯 Goals", count: null },
    { id: "network", label: "👥 Network", count: (stats?.followersCount || 0) + (stats?.followingCount || 0) },
    { id: "clubs", label: "🏛️ Clubs", count: clubs.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-16 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 shadow-xl shrink-0">
              <div className="w-full h-full bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-4xl overflow-hidden">
                {profile.avatar ? (
                  <img src={`http://localhost:5000${profile.avatar}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">{profile.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {/* Clickable Username with Badge */}
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <button 
                  onClick={() => setShowSummary(!showSummary)}
                  className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                >
                  @{profile.username || profile.name.toLowerCase().replace(/\s/g, '')}
                </button>
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">
                  {stats?.booksRead || 0} Reads
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1 justify-center md:justify-start">
                <span className="font-medium">Followers <span className="text-purple-600 dark:text-purple-400">{stats?.followersCount || 0}</span></span>
                <span className="font-medium">Following <span className="text-purple-600 dark:text-purple-400">{stats?.followingCount || 0}</span></span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic text-sm max-w-md mt-2">
                "{profile.about || "Hey there! I'm using Limerence 📚"}"
              </p>
              
              {/* Quick Stats Row - CLICKABLE */}
              <div className="flex gap-6 mt-4 justify-center md:justify-start">
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate("/profile/network?tab=followers")}
                >
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats?.followersCount || 0}</div>
                  <div className="text-xs text-gray-500 hover:text-purple-500">Followers</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate("/profile/network?tab=following")}
                >
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats?.followingCount || 0}</div>
                  <div className="text-xs text-gray-500 hover:text-purple-500">Following</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate("/profile/books?status=completed")}
                >
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats?.booksRead || 0}</div>
                  <div className="text-xs text-gray-500 hover:text-purple-500">Books Read</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => setActiveTab("stats")}
                >
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats?.badgesEarned || badges.length}</div>
                  <div className="text-xs text-gray-500 hover:text-purple-500">Badges</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-purple-700 transition text-sm"
              >
                ✏️ Edit Profile
              </button>
              <button 
                onClick={handleLogout}
                className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition border border-gray-300 dark:border-slate-600 text-sm"
              >
                🚪 Log Out
              </button>
            </div>
          </div>

          {/* Edit Form Modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 p-3 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Name"
                  />
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 ml-1">Profile Picture</label>
                    <input
                      type="file"
                      onChange={(e) => setEditForm({ ...editForm, avatarFile: e.target.files[0] })}
                      className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                      accept="image/*"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 ml-1">About (max 140 chars)</label>
                    <textarea
                      value={editForm.about}
                      onChange={(e) => setEditForm({ ...editForm, about: e.target.value.slice(0, 140) })}
                      className="w-full border border-gray-300 dark:border-slate-600 p-3 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                      placeholder="What's on your mind?"
                      rows={2}
                      maxLength={140}
                    />
                    <span className="text-xs text-gray-400">{editForm.about?.length || 0}/140</span>
                  </div>
                  <div className="flex justify-end gap-4 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 font-medium">
                      Cancel
                    </button>
                    <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Summary Popup Modal - Hardcover Style */}
          {showSummary && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSummary(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">📊 {profile.name}'s Summary</h3>
                  <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-center text-white">
                    <div className="text-2xl font-bold">{stats?.booksRead || 0}</div>
                    <div className="text-xs opacity-90">📚 Books Read</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-center text-white">
                    <div className="text-2xl font-bold">{(stats?.pagesRead || 0).toLocaleString()}</div>
                    <div className="text-xs opacity-90">📄 Pages</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 text-center text-white">
                    <div className="text-2xl font-bold">{stats?.authorsRead || 0}</div>
                    <div className="text-xs opacity-90">✍️ Authors</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-center text-white">
                    <div className="text-2xl font-bold">{stats?.reviewsPosted || 0}</div>
                    <div className="text-xs opacity-90">📝 Reviews</div>
                  </div>
                </div>

                {/* Books by Status */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">📖 Books by Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl">
                      <span className="text-gray-700 dark:text-gray-300">Want to Read</span>
                      <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">{stats?.shelfByStatus?.want_to_read || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                      <span className="text-gray-700 dark:text-gray-300">Currently Reading</span>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">{stats?.shelfByStatus?.reading || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 p-3 rounded-xl">
                      <span className="text-gray-700 dark:text-gray-300">Completed</span>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">{stats?.shelfByStatus?.completed || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Genre Breakdown Chart */}
                {stats?.genreBreakdown?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">📊 Top Genres</h4>
                    <div className="space-y-2">
                      {stats.genreBreakdown.map((item, idx) => {
                        const maxCount = stats.genreBreakdown[0]?.count || 1;
                        const percentage = Math.round((item.count / maxCount) * 100);
                        const colors = ['bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="w-24 text-sm text-gray-700 dark:text-gray-300 truncate">{item.genre}</span>
                            <div className="flex-1 h-5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${colors[idx % colors.length]} flex items-center justify-end pr-2`}
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs font-bold text-white">{item.count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
              }`}
            >
              {tab.label} {tab.count !== null && <span className="ml-1 opacity-75">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
          
          {/* BOOKS TAB */}
          {activeTab === "books" && (
            <div className="space-y-6">
              {/* Reading */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    📖 Currently Reading <span className="text-purple-500">({booksReading.length})</span>
                  </h3>
                  {booksReading.length > 0 && (
                    <button onClick={() => navigate("/profile/books?status=reading")} className="text-purple-600 text-sm hover:underline font-bold">
                      See all
                    </button>
                  )}
                </div>
                {booksReading.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {booksReading.slice(0, 8).map((item, i) => (
                      <div 
                        key={i} 
                        onClick={() => navigate(`/book/${item.book?._id || item.book || item.title}`)}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          {(item.book?.coverImage || item.coverImage) ? (
                            <img 
                              src={item.book?.coverImage || item.coverImage}
                              alt={item.book?.title || item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center p-2 text-center text-white text-xs font-bold ${(item.book?.coverImage || item.coverImage) ? 'hidden' : 'flex'}`}>
                            {(item.book?.title || item.title || 'Book').substring(0, 20)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No books currently reading. Start one!</p>
                )}
              </div>

              {/* Want to Read */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    📋 Want to Read <span className="text-purple-500">({booksWantToRead.length})</span>
                  </h3>
                  {booksWantToRead.length > 0 && (
                    <button onClick={() => navigate("/profile/books?status=want_to_read")} className="text-purple-600 text-sm hover:underline font-bold">
                      See all
                    </button>
                  )}
                </div>
                {booksWantToRead.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {booksWantToRead.slice(0, 8).map((item, i) => (
                      <div 
                        key={i} 
                        onClick={() => navigate(`/book/${item.book?._id || item.book || item.title}`)}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                          {(item.book?.coverImage || item.coverImage) ? (
                            <img 
                              src={item.book?.coverImage || item.coverImage}
                              alt={item.book?.title || item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center p-2 text-center text-white text-xs font-bold ${(item.book?.coverImage || item.coverImage) ? 'hidden' : 'flex'}`}>
                            {(item.book?.title || item.title || 'Book').substring(0, 20)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Your reading list is empty. Browse books to add some!</p>
                )}
              </div>

              {/* Completed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    ✅ Completed <span className="text-purple-500">({booksCompleted.length})</span>
                  </h3>
                  {booksCompleted.length > 0 && (
                    <button onClick={() => navigate("/profile/books?status=completed")} className="text-purple-600 text-sm hover:underline font-bold">
                      See all
                    </button>
                  )}
                </div>
                {booksCompleted.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {booksCompleted.slice(0, 8).map((item, i) => (
                      <div 
                        key={i} 
                        onClick={() => navigate(`/book/${item.book?._id || item.book || item.title}`)}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          {(item.book?.coverImage || item.coverImage) ? (
                            <img 
                              src={item.book?.coverImage || item.coverImage}
                              alt={item.book?.title || item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center p-2 text-center text-white text-xs font-bold ${(item.book?.coverImage || item.coverImage) ? 'hidden' : 'flex'}`}>
                            {(item.book?.title || item.title || 'Book').substring(0, 20)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No completed books yet. Keep reading!</p>
                )}
              </div>
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-center text-white">
                  <div className="text-3xl font-bold">{stats?.booksRead || 0}</div>
                  <div className="text-sm opacity-90">📚 Books Read</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-center text-white">
                  <div className="text-3xl font-bold">{(stats?.pagesRead || 0).toLocaleString()}</div>
                  <div className="text-sm opacity-90">📄 Pages Read</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-center text-white">
                  <div className="text-3xl font-bold">{stats?.authorsRead || 0}</div>
                  <div className="text-sm opacity-90">✍️ Authors Read</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-center text-white">
                  <div className="text-3xl font-bold">{stats?.reviewsPosted || 0}</div>
                  <div className="text-sm opacity-90">📝 Reviews</div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-orange-500">{stats?.currentStreak || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">🔥 Day Streak</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-green-500">{stats?.messagesSent || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">💬 Messages</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-violet-500">{stats?.badgesEarned || badges.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">🎖️ Badges</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-rose-500">{stats?.clubsMember || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">💬 Clubs</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-blue-500">{stats?.followersCount || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">👥 Followers</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-gray-100 dark:border-slate-700">
                  <div className="text-2xl font-bold text-purple-500">{stats?.followingCount || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">👤 Following</div>
                </div>
              </div>

              {/* Genre Breakdown Chart */}
              {stats?.genreBreakdown?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Your Top Genres</h3>
                  <div className="space-y-3">
                    {stats.genreBreakdown.map((item, idx) => {
                      const maxCount = stats.genreBreakdown[0]?.count || 1;
                      const percentage = Math.round((item.count / maxCount) * 100);
                      const colors = ['bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.genre}</span>
                          <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[idx % colors.length]} flex items-center justify-end pr-2 transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs font-bold text-white">{item.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Badges Section */}
              {badges.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🎖️ Your Badges</h3>
                  <div className="flex flex-wrap gap-3">
                    {badges.map((badge, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-full px-4 py-2">
                        <span className="text-2xl">{badge.icon}</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Reviews</h3>
              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md transition">
                      <div className="flex gap-4">
                        {/* Book Cover */}
                        <div 
                          className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 cursor-pointer shadow-sm"
                          onClick={() => navigate(`/book/${review.book?._id}`)}
                        >
                          {review.book?.coverImage ? (
                            <img src={review.book.coverImage} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-center font-bold text-gray-400 p-1">
                              {review.book?.title}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-500" onClick={() => navigate(`/book/${review.book?._id}`)}>
                              {review.book?.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>❤️ {review.likes?.length || 0}</span>
                              <span>•</span>
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                            "{review.content}"
                          </p>
                          
                          <button 
                            onClick={() => navigate(`/book/${review.book?._id}`)}
                            className="text-xs font-bold text-purple-600 mt-2 hover:underline"
                          >
                            Read more
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">✍️</div>
                  <p>No reviews posted yet.</p>
                  <p className="text-sm mt-1">Share your thoughts on books you've read!</p>
                </div>
              )}
            </div>
          )}

          {/* GOALS TAB */}
          {activeTab === "goals" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📚 Yearly Reading Goal</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {stats?.booksRead || 0} / {stats?.readingGoal || 12}
                  </div>
                  <span className="text-gray-500">books this year</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((stats?.booksRead || 0) / (stats?.readingGoal || 12)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round(((stats?.booksRead || 0) / (stats?.readingGoal || 12)) * 100)}% complete
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">🔥 Reading Streak</h3>
                <div className="text-4xl font-bold text-orange-500">{stats?.currentStreak || 0} days</div>
                <p className="text-sm text-gray-500 mt-1">Keep it up! Read every day to maintain your streak.</p>
              </div>
            </div>
          )}

          {/* NETWORK TAB */}
          {activeTab === "network" && (
            <div>
              <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-slate-700 p-1.5 rounded-xl">
                <button
                  onClick={() => setActiveNetworkTab("followers")}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                    activeNetworkTab === "followers" 
                      ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Followers ({followers.length})
                </button>
                <button
                  onClick={() => setActiveNetworkTab("following")}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                    activeNetworkTab === "following" 
                      ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Following ({following.length})
                </button>
              </div>

              {activeNetworkTab === "followers" && (
                <div className="space-y-4">
                  {followers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {followers.map((user, i) => (
                        <Link 
                          key={i} 
                          to={`/user/${user._id}`}
                          className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
                            {user.avatar ? (
                              <img src={`http://localhost:5000${user.avatar}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.name?.[0] || "?"
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                            {user.username && <p className="text-sm text-purple-500">@{user.username}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No followers yet. Share your profile!</p>
                  )}
                </div>
              )}

              {activeNetworkTab === "following" && (
                <div className="space-y-4">
                  {following.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {following.map((user, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-slate-600 transition">
                          <Link to={`/user/${user._id}`} className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
                              {user.avatar ? (
                                <img src={`http://localhost:5000${user.avatar}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.name?.[0] || "?"
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                              {user.username && <p className="text-sm text-purple-500">@{user.username}</p>}
                            </div>
                          </Link>
                          <button 
                            onClick={(e) => {
                                e.preventDefault();
                                handleUnfollowClick(user._id);
                            }}
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition shadow-sm border border-red-100"
                            title="Unfollow"
                          >
                             Unfollow
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Not following anyone yet. Discover readers!</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CLUBS TAB */}
          {activeTab === "clubs" && (
            <div className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4">
                {["all", "admin", "member"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setClubFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      clubFilter === filter
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {filter === "all" ? "All Clubs" : filter === "admin" ? "👑 Admin" : "Member"}
                  </button>
                ))}
              </div>

              {filteredClubs.length > 0 ? (
                <div className="grid gap-4">
                  {filteredClubs.map((club, i) => (
                    <Link 
                      key={i} 
                      to={`/club/${club._id}`}
                      className="flex items-center gap-4 bg-gray-50 dark:bg-slate-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl overflow-hidden">
                        {club.coverImage ? (
                          <img src={`http://localhost:5000${club.coverImage}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          "📚"
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white">{club.name}</p>
                          {club.isAdmin && <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">👑 Admin</span>}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{club.description?.slice(0, 60)}...</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{club.memberCount}</div>
                        <div className="text-xs text-gray-500">members</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  {clubFilter === "admin" ? "You're not an admin of any clubs." : 
                   clubFilter === "member" ? "No clubs where you're just a member." : 
                   "You haven't joined any clubs yet. Explore and join some!"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal 
        isOpen={!!unfollowTargetId}
        title="Unfollow User"
        message="Are you sure you want to stop following this user?"
        onConfirm={confirmUnfollow}
        onCancel={() => setUnfollowTargetId(null)}
        confirmText="Unfollow"
        isDestructive={true}
      />
    </div>
  );
}
