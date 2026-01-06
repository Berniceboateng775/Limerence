import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useContext(AuthContext);
  
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [myFollowing, setMyFollowing] = useState([]);

  useEffect(() => {
    fetchClubDetails();
    fetchMyFollowing();
  }, [id]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/clubs/${id}`, {
        headers: { "x-auth-token": token },
      });
      
      setClub(res.data);
      setMembers(res.data.members || []);
      setAdmins(res.data.admins || []);
      
      const myId = currentUser?._id || currentUser?.id;
      setIsMember((res.data.members || []).some(m => (m._id || m) === myId));
      setIsAdmin((res.data.admins || []).some(a => (a._id || a) === myId));
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Club not found");
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

  const handleJoinLeave = async () => {
    setActionLoading(true);
    try {
      if (isMember) {
        await axios.post(`http://localhost:5000/api/clubs/${id}/leave`, {}, {
          headers: { "x-auth-token": token },
        });
        setIsMember(false);
        setMembers(prev => prev.filter(m => (m._id || m) !== (currentUser?._id || currentUser?.id)));
      } else {
        await axios.post(`http://localhost:5000/api/clubs/${id}/join`, {}, {
          headers: { "x-auth-token": token },
        });
        setIsMember(true);
        setMembers(prev => [...prev, currentUser]);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Action failed");
    }
    setActionLoading(false);
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
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center pt-24">
        <div className="animate-pulse text-gray-500">Loading club...</div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Club Not Found</h2>
          <button onClick={() => navigate("/clubs")} className="text-purple-600 hover:underline">← Back to Clubs</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-16 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <button onClick={() => navigate("/clubs")} className="text-gray-500 hover:text-purple-600 mb-4 flex items-center gap-2">
          ← Back to Clubs
        </button>

        {/* Club Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 mb-6">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-600 relative">
            {club.coverImage && (
              <img 
                src={`http://localhost:5000${club.coverImage}`}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Club Info */}
          <div className="p-6 -mt-12 relative">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Club Icon */}
              <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-2xl shadow-xl flex items-center justify-center text-4xl border-4 border-white dark:border-slate-800">
                📚
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{club.name}</h1>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <span>👥 {members.length} members</span>
                      <span>•</span>
                      <span>👑 {admins.length} admin{admins.length > 1 ? "s" : ""}</span>
                    </p>
                  </div>

                  {/* Join/Leave Button */}
                  {!isAdmin && (
                    <button
                      onClick={handleJoinLeave}
                      disabled={actionLoading}
                      className={`px-6 py-2 rounded-full font-bold transition ${
                        isMember
                          ? "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {actionLoading ? "..." : isMember ? "Leave Club" : "Join Club"}
                    </button>
                  )}
                  {isAdmin && (
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold">
                      👑 You're an Admin
                    </span>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  {club.description || "A book club for passionate readers."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admins Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-slate-700 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            👑 Admins
          </h2>
          <div className="flex flex-wrap gap-3">
            {admins.map((admin, i) => (
              <Link
                key={i}
                to={`/user/${admin._id || admin}`}
                className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold overflow-hidden">
                  {admin.avatar ? (
                    <img src={`http://localhost:5000${admin.avatar}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    admin.name?.[0] || "?"
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{admin.name || "Admin"}</p>
                  {admin.username && <p className="text-xs text-yellow-600">@{admin.username}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            👥 Members <span className="text-purple-500">({members.length})</span>
          </h2>
          
          {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((member, i) => {
                const memberId = member._id || member;
                const isMe = memberId === (currentUser?._id || currentUser?.id);
                const isAdminMember = admins.some(a => (a._id || a) === memberId);
                
                return (
                  <div 
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                    <Link 
                      to={`/user/${memberId}`}
                      className="flex items-center gap-4 flex-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 shadow">
                        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                          {member.avatar ? (
                            <img src={`http://localhost:5000${member.avatar}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500">{member.name?.[0] || "?"}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white">{member.name || "Member"}</p>
                          {isAdminMember && <span className="text-yellow-500">👑</span>}
                        </div>
                        {member.username && <p className="text-sm text-purple-500">@{member.username}</p>}
                      </div>
                    </Link>

                    {/* Follow button (not for self) */}
                    {!isMe && (
                      <button
                        onClick={() => handleFollow(memberId)}
                        className={`px-3 py-1.5 rounded-full font-bold text-xs transition ${
                          myFollowing.includes(memberId)
                            ? "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                      >
                        {myFollowing.includes(memberId) ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No members yet. Be the first to join!</p>
          )}
        </div>

        {/* Club Chat Preview (if member) */}
        {isMember && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">💬 Club Chat</h2>
              <button 
                onClick={() => navigate("/clubs")}
                className="text-purple-600 hover:underline text-sm font-medium"
              >
                Open Full Chat →
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 text-center">
              <p className="text-gray-500">Chat preview coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
