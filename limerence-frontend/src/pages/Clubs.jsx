import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null); // For chat view
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: "", description: "", currentBook: "" });
  const [message, setMessage] = useState("");
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await axios.get("/api/clubs");
      setClubs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/clubs", newClub, {
        headers: { "x-auth-token": token },
      });
      setShowCreateModal(false);
      fetchClubs();
      setNewClub({ name: "", description: "", currentBook: "" });
    } catch (err) {
      alert("Failed to create club");
    }
  };

  const handleJoin = async (id) => {
    try {
      await axios.post(`/api/clubs/${id}/join`, {}, {
        headers: { "x-auth-token": token },
      });
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to join");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const res = await axios.post(`/api/clubs/${selectedClub._id}/messages`, 
        { content: message },
        { headers: { "x-auth-token": token } }
      );
      // Update local state immediately
      setSelectedClub(prev => ({
        ...prev,
        messages: [...prev.messages, res.data]
      }));
      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  // If a club is selected, show the Chat View
  if (selectedClub) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSelectedClub(null)} className="text-purple-600 font-bold">
            ← Back to Clubs
          </button>
          <h2 className="font-bold text-xl">{selectedClub.name}</h2>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-24">
          {selectedClub.messages && selectedClub.messages.length > 0 ? (
            selectedClub.messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.user === user?._id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.user === user?._id 
                    ? "bg-purple-600 text-white rounded-br-none" 
                    : "bg-white text-gray-800 shadow-sm rounded-bl-none"
                }`}>
                  <p className="text-xs opacity-70 mb-1">{msg.user?.name || "User"}</p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 mt-10">No messages yet. Start the conversation!</div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t fixed bottom-0 w-full md:w-[calc(100%-4rem)] md:relative">
          <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border p-3 rounded-full focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button 
              type="submit"
              className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition w-12 h-12 flex items-center justify-center"
            >
              ➤
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Club List View
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-dream-gradient text-white py-12 px-4 rounded-b-[2rem] shadow-lg mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2">Book Clubs</h1>
          <p className="text-white/90">Join the discussion. Find your tribe.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 bg-white text-purple-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-gray-100 transition"
          >
            + Create New Club
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 grid gap-6">
        {clubs.map((club) => {
          const isMember = club.members.some((m) => (m._id || m) === user?._id);
          const isAdmin = club.admins?.some((a) => (a._id || a) === user?._id);

          return (
            <div 
              key={club._id} 
              onClick={() => isMember && setSelectedClub(club)}
              className={`bg-white p-6 rounded-xl shadow-md transition border-l-4 ${isMember ? "border-purple-500 cursor-pointer hover:shadow-lg" : "border-transparent"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {club.name}
                    {isAdmin && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Admin</span>}
                  </h3>
                  <p className="text-gray-600 mt-1">{club.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <span>📖 Reading: <strong>{club.currentBook?.title || "Nothing yet"}</strong></span>
                    <span>•</span>
                    <span>👥 {club.members.length} members</span>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {isMember ? (
                    <button 
                      onClick={() => setSelectedClub(club)}
                      className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium hover:bg-purple-200 transition"
                    >
                      Open Chat
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(club._id)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md hover:bg-purple-700 transition"
                    >
                      Join Club
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create a Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <input
                type="text"
                placeholder="Club Name"
                className="w-full border p-2 rounded-lg"
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                className="w-full border p-2 rounded-lg"
                value={newClub.description}
                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Current Book (Optional)"
                className="w-full border p-2 rounded-lg"
                value={newClub.currentBook}
                onChange={(e) => setNewClub({ ...newClub, currentBook: { title: e.target.value } })}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
