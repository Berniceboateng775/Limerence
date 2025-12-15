import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function Profile() {
  const { token, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", avatar: "" });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { "x-auth-token": token },
      });
      setProfile(res.data);
      setEditForm({ 
        name: res.data.name, 
        email: res.data.email,
        avatar: res.data.avatar || "" 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      if (editForm.avatarFile) {
          formData.append("avatar", editForm.avatarFile);
      } else if (editForm.avatar) {
          // Keep existing URL if no new file
          // Actually backend expects 'avatar' as file or nothing. 
          // If we send nothing, it keeps old.
      }

      const res = await axios.put("http://localhost:5000/api/auth/me", formData, {
        headers: { 
            "x-auth-token": token,
            "Content-Type": "multipart/form-data"
        },
      });
      setProfile(res.data);
      setIsEditing(false);
      // Update context user if needed
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  if (!profile) return <div className="p-8 text-center">Loading...</div>;

  // Use real badges or empty
  const badges = profile.badges || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-dream-gradient h-48 rounded-b-[3rem] shadow-lg relative"></div>
      
      <div className="max-w-2xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-32 h-32 bg-purple-100 rounded-full mx-auto border-4 border-white shadow-md flex items-center justify-center text-4xl mb-4 overflow-hidden">
            {profile.avatar ? (
                <img src={`http://localhost:5000${profile.avatar}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <span>{profile.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          {!isEditing ? (
            <>
              <h1 className="text-3xl font-serif font-bold text-gray-800">{profile.name}</h1>
              <p className="text-gray-500 mb-6">{profile.email}</p>
              
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
                  className="bg-gray-100 text-gray-600 px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
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
                className="w-full border p-2 rounded-lg"
                placeholder="Name"
              />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full border p-2 rounded-lg"
                placeholder="Email"
              />
               <div className="text-left">
                   <label className="text-sm text-gray-500 ml-1">Profile Picture</label>
                   <input
                    type="file"
                    onChange={(e) => setEditForm({ ...editForm, avatarFile: e.target.files[0] })}
                    className="w-full border p-2 rounded-lg bg-white"
                    accept="image/*"
                  />
               </div>
              <div className="flex justify-center gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700"
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

          <div className="mt-12 grid grid-cols-3 gap-4 border-t pt-8">
            <div>
              <div className="text-2xl font-bold text-purple-600">{profile.shelf?.length || 0}</div>
              <div className="text-sm text-gray-500">Books</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-500">Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-500">Clubs</div>
            </div>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <div className="mt-8 border-t pt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Badges Earned</h3>
                <div className="flex flex-wrap justify-center gap-4">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-100 w-24">
                            <span className="text-3xl mb-1">{badge.icon}</span>
                            <span className="text-xs font-bold text-gray-700">{badge.name}</span>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
