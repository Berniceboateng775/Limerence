import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function NetworkPage() {
  const { id } = useParams(); // Optional: view another user's network
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useContext(AuthContext);
  
  const [activeFilter, setActiveFilter] = useState(searchParams.get("tab") || "followers");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [mutual, setMutual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [myFollowing, setMyFollowing] = useState([]);

  const userId = id || currentUser?._id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?._id || id === currentUser?.id;

  useEffect(() => {
    fetchNetworkData();
    fetchMyFollowing();
  }, [userId]);

  useEffect(() => {
    setActiveFilter(searchParams.get("tab") || "followers");
  }, [searchParams]);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      
      // Get profile info
      const profileRes = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: { "x-auth-token": token },
      });
      setProfileName(profileRes.data.name || profileRes.data.username);

      // Get followers
      const followersRes = await axios.get(`http://localhost:5000/api/users/${userId}/followers`, {
        headers: { "x-auth-token": token },
      });
      setFollowers(followersRes.data.followers || []);

      // Get following
      const followingRes = await axios.get(`http://localhost:5000/api/users/${userId}/following`, {
        headers: { "x-auth-token": token },
      });
      setFollowing(followingRes.data.following || []);

      // Calculate mutual (users who follow back)
      const followerIds = (followersRes.data.followers || []).map(u => u._id);
      const followingIds = (followingRes.data.following || []).map(u => u._id);
      const mutualIds = followerIds.filter(id => followingIds.includes(id));
      const mutualUsers = (followersRes.data.followers || []).filter(u => mutualIds.includes(u._id));
      setMutual(mutualUsers);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchMyFollowing = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${currentUser?._id || currentUser?.id}/following`, {
        headers: { "x-auth-token": token },
      });
      setMyFollowing((res.data.following || []).map(u => u._id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async (targetId) => {
    try {
      const isFollowing = myFollowing.includes(targetId);
      if (isFollowing) {
        await axios.delete(`http://localhost:5000/api/users/follow/${targetId}`, {
          headers: { "x-auth-token": token },
        });
        setMyFollowing(prev => prev.filter(id => id !== targetId));
      } else {
        await axios.post(`http://localhost:5000/api/users/follow/${targetId}`, {}, {
          headers: { "x-auth-token": token },
        });
        setMyFollowing(prev => [...prev, targetId]);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Action failed");
    }
  };

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    setSearchParams({ tab: filter });
  };

  const getCurrentList = () => {
    switch (activeFilter) {
      case "followers": return followers;
      case "following": return following;
      case "mutual": return mutual;
      default: return followers;
    }
  };

  const currentList = getCurrentList();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center pt-24">
        <div className="animate-pulse text-gray-500">Loading network...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-16 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(isOwnProfile ? "/profile" : `/user/${id}`)} className="text-gray-500 hover:text-purple-600">
            ← Back to Profile
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isOwnProfile ? "Your Network" : `${profileName}'s Network`}
          </h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow">
          {[
            { id: "followers", label: "Followers", count: followers.length },
            { id: "following", label: "Following", count: following.length },
            ...(!isOwnProfile ? [{ id: "mutual", label: "Mutual", count: mutual.length }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => changeFilter(tab.id)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                activeFilter === tab.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeFilter === tab.id 
                  ? "bg-white/20" 
                  : "bg-gray-200 dark:bg-slate-600"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-4 border border-gray-100 dark:border-slate-700">
          {currentList.length > 0 ? (
            <div className="space-y-3">
              {currentList.map((user, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  {/* Clickable avatar + info */}
                  <Link 
                    to={`/user/${user._id}`}
                    className="flex items-center gap-4 flex-1"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 shadow">
                      <div className="w-full h-full rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xl overflow-hidden">
                        {user.avatar ? (
                          <img src={`http://localhost:5000${user.avatar}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500">{user.name?.[0] || "?"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                      {user.username && <p className="text-sm text-purple-500">@{user.username}</p>}
                      <p className="text-xs text-gray-500">{user.about?.slice(0, 50) || "Reader on Limerence"}</p>
                    </div>
                  </Link>

                  {/* Follow button (don't show for self) */}
                  {user._id !== (currentUser?._id || currentUser?.id) && (
                    <button
                      onClick={() => handleFollow(user._id)}
                      className={`px-4 py-2 rounded-full font-bold text-sm transition ${
                        myFollowing.includes(user._id)
                          ? "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {myFollowing.includes(user._id) ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">
                {activeFilter === "followers" ? "👥" : activeFilter === "following" ? "➡️" : "🤝"}
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {activeFilter === "followers" && "No followers yet"}
                {activeFilter === "following" && "Not following anyone yet"}
                {activeFilter === "mutual" && "No mutual connections yet"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {activeFilter === "followers" && "Share your profile to get followers!"}
                {activeFilter === "following" && "Discover readers to follow!"}
                {activeFilter === "mutual" && "Follow people who follow you back!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
