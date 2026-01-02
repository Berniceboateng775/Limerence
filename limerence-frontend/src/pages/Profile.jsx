import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function Profile() {
  const { token, logout, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", avatar: "", about: "" });
  const [clubsCount, setClubsCount] = useState(0);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (profile?._id) fetchClubsCount();
    // eslint-disable-next-line
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

  const fetchClubsCount = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clubs", {
        headers: { "x-auth-token": token },
      });
      const myClubs = res.data.filter(c => 
        c.members?.some(m => (m._id || m) === profile?._id)
      );
      setClubsCount(myClubs.length);
    } catch (err) {
      console.error(err);
    }
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

  if (!profile) return <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 min-h-screen flex items-center justify-center">Loading...</div>;

  const badges = profile.badges || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 pt-24 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-slate-700">
          {/* Avatar */}
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto p-1 shadow-xl mb-4">
            <div className="w-full h-full bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-4xl overflow-hidden">
              {profile.avatar ? (
                  <img src={`http://localhost:5000${profile.avatar}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                  <span className="text-gray-500 dark:text-gray-400">{profile.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          
          {!isEditing ? (
            <>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-2">{profile.email}</p>
              
              {/* About Section */}
              <p className="text-gray-600 dark:text-gray-300 italic text-sm mb-6 max-w-sm mx-auto">
                "{profile.about || "Hey there! I'm using Limerence 📚"}"
              </p>
              
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-purple-700 transition"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => {
                      logout();
                      window.location.href = "/login";
                  }}
                  className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition border border-gray-300 dark:border-slate-600"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdate} className="max-w-sm mx-auto space-y-4">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 p-3 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Name"
              />
               <div className="text-left">
                   <label className="text-sm text-gray-500 dark:text-gray-400 ml-1">Profile Picture</label>
                   <input
                    type="file"
                    onChange={(e) => setEditForm({ ...editForm, avatarFile: e.target.files[0] })}
                    className="w-full border border-gray-300 dark:border-slate-600 p-2 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 dark:file:bg-purple-500/20 file:text-purple-600 dark:file:text-purple-400 hover:file:bg-purple-200 dark:hover:file:bg-purple-500/30"
                    accept="image/*"
                  />
               </div>
               
               {/* About Field */}
               <div className="text-left">
                   <label className="text-sm text-gray-500 dark:text-gray-400 ml-1">About (max 140 chars)</label>
                   <textarea
                    value={editForm.about}
                    onChange={(e) => setEditForm({ ...editForm, about: e.target.value.slice(0, 140) })}
                    className="w-full border border-gray-300 dark:border-slate-600 p-3 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                    placeholder="What's on your mind?"
                    rows={2}
                    maxLength={140}
                   />
                   <span className="text-xs text-gray-400">{editForm.about?.length || 0}/140</span>
               </div>
               
              <div className="flex justify-center gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-green-600 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-slate-700 pt-8">
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.shelf?.length || 0}</div>
              <div className="text-sm text-gray-500">Books</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.friends?.length || 0}</div>
              <div className="text-sm text-gray-500">Friends</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{clubsCount}</div>
              <div className="text-sm text-gray-500">Clubs</div>
            </div>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Badges Earned</h3>
                <div className="flex flex-wrap justify-center gap-4">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="flex flex-col items-center p-3 bg-gray-100 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 w-24">
                            <span className="text-3xl mb-1">{badge.icon}</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{badge.name}</span>
                        </div>
                    ))}                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
