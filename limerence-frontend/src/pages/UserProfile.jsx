import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("books");
  const [activeNetworkTab, setActiveNetworkTab] = useState("followers");
  
  // Relationship states
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  
  // Tab data
  const [clubs, setClubs] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [reviews, setReviews] = useState([]);

  const isOwnProfile = currentUser?._id === id || currentUser?.id === id;

  useEffect(() => {
    if (isOwnProfile) {
      navigate("/profile");
      return;
    }
    fetchUserProfile();
  }, [id]);

  useEffect(() => {
    if (profile?._id) {
      fetchStats();
      fetchClubs();
      fetchFollowers();
      fetchFollowing();
      fetchReviews();
      checkRelationship();
    }
  }, [profile]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
        headers: { "x-auth-token": token },
      });
      setProfile(res.data);
      setLoading(false);
    } catch (err) {
      setError("User not found");
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${id}/stats`, {
        headers: { "x-auth-token": token },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${id}/clubs`, {
        headers: { "x-auth-token": token },
      });
      setClubs(res.data.clubs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${id}/followers`, {
        headers: { "x-auth-token": token },
      });
      setFollowers(res.data.followers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${id}/following`, {
        headers: { "x-auth-token": token },
      });
      setFollowing(res.data.following || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${id}/reviews`, {
        headers: { "x-auth-token": token },
      });
      setReviews(res.data.reviews || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const checkRelationship = async () => {
    try {
      // Check if current user follows this profile
      const myFollowingRes = await axios.get(`http://localhost:5000/api/users/${currentUser._id || currentUser.id}/following`, {
        headers: { "x-auth-token": token },
      });
      const myFollowing = myFollowingRes.data.following || [];
      setIsFollowing(myFollowing.some(u => (u._id || u) === id));

      // Check if already friends
      const meRes = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { "x-auth-token": token },
      });
      const myFriends = meRes.data.friends || [];
      setIsFriend(myFriends.some(f => (f._id || f) === id));
      
      // Check if friend request was sent
      const pendingRequests = profile.friendRequests || [];
      setFriendRequestSent(pendingRequests.some(r => (r.from?._id || r.from) === (currentUser._id || currentUser.id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = () => {
    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      executeFollow();
    }
  };

  const executeFollow = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/users/follow/${id}`, {}, {
        headers: { "x-auth-token": token },
      });
      setIsFollowing(true);
      toast("Followed successfully!");
    } catch (err) {
      if (err.response?.status === 400 || (err.response?.data?.msg && err.response.data.msg.toLowerCase().includes("already"))) {
        setIsFollowing(true);
        // Silent success or minimal feedback as requested
      } else {
        toast(err.response?.data?.msg || "Action failed", "error");
      }
    }
    setActionLoading(false);
  };

  const confirmUnfollow = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/users/follow/${id}`, {
        headers: { "x-auth-token": token },
      });
      setIsFollowing(false);
      toast("Unfollowed successfully!");
    } catch (err) {
       toast(err.response?.data?.msg || "Action failed", "error");
    }
    setActionLoading(false);
    setShowUnfollowModal(false);
  };

  const handleFriendRequest = async () => {
    setActionLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/users/friend-request/${id}`, {}, {
        headers: { "x-auth-token": token },
      });
      setFriendRequestSent(true);
      setFriendRequestSent(true);
      toast("Friend request sent!");
    } catch (err) {
      toast(err.response?.data?.msg || "Failed to send request", "error");
    }
    setActionLoading(false);
  };

  const handleMessage = () => {
    navigate("/friends", { state: { openChatWith: id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h2>
          <p className="text-gray-500 mb-4">This user doesn't exist or has been removed.</p>
          <button onClick={() => navigate(-1)} className="text-purple-600 hover:underline">← Go Back</button>
        </div>
      </div>
    );
  }

  const shelf = profile.shelf || [];
  const booksReading = shelf.filter(b => b.status === "reading");
  const booksCompleted = shelf.filter(b => b.status === "completed");
  const booksWantToRead = shelf.filter(b => b.status === "want_to_read");
  const badges = profile.badges || [];

  const TABS = [
    { id: "books", label: "📚 Books", count: shelf.length },
    { id: "reviews", label: "⭐ Reviews", count: reviews.length },
    { id: "stats", label: "📊 Stats", count: null },
    { id: "network", label: "👥 Network", count: followers.length + following.length },
    { id: "clubs", label: "🏛️ Clubs", count: clubs.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-16 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-purple-600 mb-4 flex items-center gap-2">
          ← Back
        </button>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1 shadow-xl shrink-0">
              <div className="w-full h-full bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-4xl overflow-hidden">
                {profile.avatar ? (
                  <img src={`http://localhost:5000${profile.avatar}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">{profile.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              {profile.username && <p className="text-purple-500 dark:text-purple-400">@{profile.username}</p>}
              <p className="text-gray-600 dark:text-gray-300 italic text-sm max-w-md mt-2">
                "{profile.about || "Hey there! I'm using Limerence 📚"}"
              </p>
              
              {/* Quick Stats Row - CLICKABLE */}
              <div className="flex gap-6 mt-4 justify-center md:justify-start">
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate(`/user/${id}/network?tab=followers`)}
                >
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats?.followersCount || followers.length}</div>
                  <div className="text-xs text-gray-500 hover:text-purple-500">Followers</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate(`/user/${id}/network?tab=following`)}
                >
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats?.followingCount || following.length}</div>
                  <div className="text-xs text-gray-500 hover:text-purple-500">Following</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate(`/user/${id}/books?status=completed`)}
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
              {/* Follow Button */}
              <button 
                onClick={handleFollow}
                disabled={actionLoading}
                className={`px-6 py-2 rounded-full font-bold shadow-md transition text-sm ${
                  isFollowing
                    ? "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {actionLoading ? "..." : isFollowing ? "✓ Following" : "➕ Follow"}
              </button>
              
              {/* Friend Button */}
              {isFriend ? (
                <button 
                  onClick={handleMessage}
                  className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition text-sm"
                >
                  💬 Message
                </button>
              ) : friendRequestSent ? (
                <button 
                  disabled
                  className="bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-gray-400 px-6 py-2 rounded-full font-bold text-sm cursor-not-allowed"
                >
                  ⏳ Request Sent
                </button>
              ) : (
                <button 
                  onClick={handleFriendRequest}
                  disabled={actionLoading}
                  className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-600 transition text-sm"
                >
                  🤝 Add Friend
                </button>
              )}
            </div>
          </div>
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
              {shelf.length > 0 ? (
                <>
                  {booksReading.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">📖 Currently Reading ({booksReading.length})</h3>
                        <button onClick={() => navigate(`/user/${id}/books?status=reading`)} className="text-purple-600 text-sm hover:underline font-bold">See all</button>
                      </div>
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
                    </div>
                  )}
                  {booksWantToRead.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">📋 Want to Read ({booksWantToRead.length})</h3>
                        <button onClick={() => navigate(`/user/${id}/books?status=want_to_read`)} className="text-purple-600 text-sm hover:underline font-bold">See all</button>
                      </div>
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
                    </div>
                  )}
                  {booksCompleted.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">✅ Completed ({booksCompleted.length})</h3>
                        <button onClick={() => navigate(`/user/${id}/books?status=completed`)} className="text-purple-600 text-sm hover:underline font-bold">See all</button>
                      </div>
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
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">This user hasn't added any books yet.</p>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-4 border border-gray-100 dark:border-slate-600">
                    <div className="flex items-start gap-4">
                      {/* Book Cover */}
                      <div 
                        onClick={() => navigate(`/book/${review.bookId || review.book?._id}`)}
                        className="w-16 h-24 rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-xl transition flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                      >
                        {review.bookCover || review.book?.coverImage ? (
                          <img src={review.bookCover || review.book?.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs text-center p-1">{review.bookTitle || review.book?.title || 'Book'}</span>
                        )}
                      </div>
                      
                      {/* Review Content */}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">{review.bookTitle || review.book?.title || 'Unknown Book'}</h4>
                        <div className="flex items-center gap-1 my-1">
                          {[1,2,3,4,5].map(star => (
                            <span key={star} className={star <= (review.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{review.content || review.text || 'No review text'}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {/* Likes */}
                    {review.likes && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                        <span>❤️ {review.likes.length || 0} likes</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">This user hasn't written any reviews yet.</p>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === "stats" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-center text-white">
                <div className="text-3xl font-bold">{stats?.booksRead || 0}</div>
                <div className="text-sm opacity-90">Books Read</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-center text-white">
                <div className="text-3xl font-bold">{stats?.reviewsPosted || 0}</div>
                <div className="text-sm opacity-90">Reviews</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-4 text-center text-white">
                <div className="text-3xl font-bold">{stats?.currentStreak || 0}</div>
                <div className="text-sm opacity-90">Day Streak 🔥</div>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl p-4 text-center text-white">
                <div className="text-3xl font-bold">{badges.length}</div>
                <div className="text-sm opacity-90">Badges</div>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-4 text-center text-white">
                <div className="text-3xl font-bold">{stats?.clubsMember || clubs.length}</div>
                <div className="text-sm opacity-90">Clubs</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-center text-white">
                <div className="text-3xl font-bold">{stats?.booksOnShelf || shelf.length}</div>
                <div className="text-sm opacity-90">On Shelf</div>
              </div>
              
              {badges.length > 0 && (
                <div className="col-span-full mt-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🎖️ Badges</h3>
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

          {/* NETWORK TAB */}
          {activeTab === "network" && (
            <div>
              {/* Network Filter Tabs */}
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

              {/* Followers List */}
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
                    <p className="text-gray-500 text-sm">No followers yet.</p>
                  )}
                </div>
              )}

              {/* Following List */}
              {activeNetworkTab === "following" && (
                <div className="space-y-4">
                  {following.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {following.map((user, i) => (
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
                    <p className="text-gray-500 text-sm">Not following anyone.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CLUBS TAB */}
          {activeTab === "clubs" && (
            <div>
              {clubs.length > 0 ? (
                <div className="grid gap-4">
                  {clubs.map((club, i) => (
                    <Link 
                      key={i}
                      to={`/club/${club?._id || club?.id || club}`}
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
                <p className="text-gray-500 text-center py-8">This user hasn't joined any clubs.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal 
        isOpen={showUnfollowModal}
        title="Unfollow User"
        message={`Are you sure you want to unfollow ${profile?.name}?`}
        onConfirm={confirmUnfollow}
        onCancel={() => setShowUnfollowModal(false)}
        confirmText="Unfollow"
        isDestructive={true}
      />
    </div>
  );
}
