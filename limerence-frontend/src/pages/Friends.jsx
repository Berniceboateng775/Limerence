import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

export default function Friends() {
  const { token, user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axios.get("/api/users/me", {
        headers: { "x-auth-token": token }
      });
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // DM functionality placeholder - would need backend endpoint
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    
    // Add message locally for now (backend DM routes would be needed)
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: newMessage,
      sender: user,
      createdAt: new Date()
    }]);
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-20 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-6">Friends</h1>
        
        <div className="flex gap-6 h-[600px]">
          {/* Friends List */}
          <div className="w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-bold text-gray-800 dark:text-white">My Friends ({friends.length})</h2>
            </div>
            
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {friends.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <span className="text-4xl block mb-2">👋</span>
                  <p className="text-sm">No friends yet!</p>
                  <p className="text-xs mt-1">Visit Clubs to meet readers</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-slate-700 ${
                      selectedFriend?._id === friend._id ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden">
                      {friend.avatar ? (
                        <img src={`http://localhost:5000${friend.avatar}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        friend.name?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-white truncate">{friend.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{friend.nickname || 'Online'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden">
                    {selectedFriend.avatar ? (
                      <img src={`http://localhost:5000${selectedFriend.avatar}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      selectedFriend.name?.[0]
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">{selectedFriend.name}</h3>
                    <p className="text-xs text-green-500">Active now</p>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900/50">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <span className="text-5xl mb-2">💬</span>
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Say hi to {selectedFriend.name}!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`mb-3 flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl ${
                          msg.sender._id === user._id 
                            ? 'bg-purple-500 text-white rounded-br-sm' 
                            : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedFriend.name}...`}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 border-none rounded-full px-4 py-3 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-300 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 transition disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-7xl mb-4">👯</span>
                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">Select a friend</h3>
                <p className="text-sm">Choose someone to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
