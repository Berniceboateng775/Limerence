import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { toast } from "../components/Toast";

// Premium wallpapers
const WALLPAPERS = [
  { id: 'none', name: 'Default', preview: 'bg-slate-900' },
  { id: 'gradient1', name: 'Aurora', preview: 'bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900' },
  { id: 'gradient2', name: 'Ocean', preview: 'bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-900' },
  { id: 'gradient3', name: 'Sunset', preview: 'bg-gradient-to-br from-orange-900 via-slate-900 to-rose-900' },
  { id: 'gradient4', name: 'Forest', preview: 'bg-gradient-to-br from-green-900 via-slate-900 to-emerald-900' },
  { id: 'gradient5', name: 'Midnight', preview: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950' },
];

export default function Friends() {
  const { token, user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState('gradient1');
  const [customWallpaper, setCustomWallpaper] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const fileInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      fetchConversation(selectedFriend._id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  // Fetch conversation with DM API
  const fetchConversation = async (friendId) => {
    try {
      const res = await axios.get(`/api/dm/${friendId}`, {
        headers: { "x-auth-token": token }
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch fresh profile data from API
  const fetchFriendProfile = async (friendId) => {
    setLoadingProfile(true);
    try {
      const res = await axios.get(`/api/users/${friendId}`, {
        headers: { "x-auth-token": token }
      });
      setViewProfile(res.data);
    } catch (err) {
      console.error(err);
      toast("Failed to load profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Add emoji to message
  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle custom wallpaper upload
  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomWallpaper(reader.result);
        setCurrentWallpaper('custom');
        setShowWallpaperPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload and send
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedFriend) return;
    
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('attachmentType', 'image');
    formData.append('content', '');
    
    try {
      const res = await axios.post(`/api/dm/${selectedFriend._id}/message`, formData, {
        headers: { 
          "x-auth-token": token,
          "Content-Type": "multipart/form-data"
        }
      });
      setMessages(prev => [...prev, res.data]);
      toast("Image sent!", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to send image", "error");
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceNote = async () => {
    if (!audioBlob || !selectedFriend) return;
    
    const formData = new FormData();
    formData.append('attachment', audioBlob, 'voice.webm');
    formData.append('attachmentType', 'voice');
    formData.append('content', '');
    
    try {
      const res = await axios.post(`/api/dm/${selectedFriend._id}/message`, formData, {
        headers: { 
          "x-auth-token": token,
          "Content-Type": "multipart/form-data"
        }
      });
      setMessages(prev => [...prev, res.data]);
      setAudioBlob(null);
      toast("Voice note sent!", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to send voice note", "error");
    }
  };

  // Send message via API
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    
    try {
      const res = await axios.post(`/api/dm/${selectedFriend._id}/message`, 
        { content: newMessage },
        { headers: { "x-auth-token": token } }
      );
      setMessages(prev => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
      toast("Failed to send message", "error");
    }
  };

  // Add reaction via API
  const addReaction = async (messageId, emoji) => {
    if (!selectedFriend) return;
    
    try {
      await axios.post(
        `/api/dm/${selectedFriend._id}/message/${messageId}/reaction`,
        { emoji },
        { headers: { "x-auth-token": token } }
      );
      // Refresh conversation
      fetchConversation(selectedFriend._id);
    } catch (err) {
      console.error(err);
    }
  };

  const getWallpaperStyle = () => {
    if (currentWallpaper === 'custom' && customWallpaper) {
      return { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return {};
  };

  const getWallpaperClass = () => {
    if (currentWallpaper === 'custom') return '';
    const wp = WALLPAPERS.find(w => w.id === currentWallpaper);
    return wp?.preview || 'bg-slate-900';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-0 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-[calc(100vh-80px)]">
        
        <div className="flex gap-0 h-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700">
          {/* Friends List */}
          <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
              <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Friends</h1>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {friends.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <span className="text-5xl block mb-3">👋</span>
                  <p className="font-bold">No friends yet!</p>
                  <p className="text-xs mt-1">Visit Clubs to meet readers</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => {
                      setSelectedFriend(friend);
                      setViewProfile(null);
                    }}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-slate-700 ${
                      selectedFriend?._id === friend._id ? 'bg-purple-50 dark:bg-purple-900/30 border-l-4 border-purple-500' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                      {friend.avatar ? (
                        <img src={`http://localhost:5000${friend.avatar}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        friend.name?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-white truncate">{friend.name}</h3>
                      <p className="text-xs text-green-500">Online</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedFriend && !viewProfile ? (
              <>
                {/* Chat Header */}
                <div 
                  className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  onClick={() => fetchFriendProfile(selectedFriend._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden">
                      {selectedFriend.avatar ? (
                        <img src={`http://localhost:5000${selectedFriend.avatar}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        selectedFriend.name?.[0]
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{selectedFriend.name}</h3>
                      <p className="text-xs text-green-500">Tap to view profile</p>
                    </div>
                  </div>
                  
                  {/* Wallpaper Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWallpaperPicker(!showWallpaperPicker);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition"
                    title="Change wallpaper"
                  >
                    🎨
                  </button>
                </div>
                
                {/* Wallpaper Picker */}
                {showWallpaperPicker && (
                  <div className="absolute right-20 top-32 bg-white dark:bg-slate-700 rounded-xl shadow-2xl p-4 z-50 border border-gray-200 dark:border-slate-600">
                    <h4 className="text-xs font-bold text-gray-400 mb-3">Choose Wallpaper</h4>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {WALLPAPERS.map(wp => (
                        <button
                          key={wp.id}
                          onClick={() => {
                            setCurrentWallpaper(wp.id);
                            setCustomWallpaper(null);
                            setShowWallpaperPicker(false);
                          }}
                          className={`w-16 h-16 rounded-lg ${wp.preview} ${currentWallpaper === wp.id ? 'ring-2 ring-purple-500' : ''}`}
                          title={wp.name}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => wallpaperInputRef.current?.click()}
                      className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600 transition"
                    >
                      📷 Upload Custom
                    </button>
                    <input
                      type="file"
                      ref={wallpaperInputRef}
                      onChange={handleWallpaperUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}
                
                {/* Messages Area */}
                <div 
                  className={`flex-1 p-4 overflow-y-auto ${getWallpaperClass()}`}
                  style={getWallpaperStyle()}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <span className="text-6xl mb-3">💬</span>
                      <p className="text-lg font-bold">Start a conversation</p>
                      <p className="text-sm opacity-75">Say hi to {selectedFriend.name}!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg._id} className={`mb-4 flex ${msg.sender?._id === user?._id || msg.sender === user?._id ? 'justify-end' : 'justify-start'}`}>
                        <div className="relative group max-w-[70%]">
                          <div className={`p-3 rounded-2xl shadow-md ${
                            msg.sender?._id === user?._id || msg.sender === user?._id
                              ? 'bg-purple-500 text-white rounded-br-sm' 
                              : 'bg-white/90 dark:bg-slate-700/90 text-gray-800 dark:text-white rounded-bl-sm'
                          }`}>
                            {/* Image attachment */}
                            {msg.attachmentType === 'image' && msg.attachment && (
                              <img 
                                src={`http://localhost:5000${msg.attachment}`} 
                                alt="Shared" 
                                className="max-w-full rounded-lg mb-2 cursor-pointer"
                                onClick={() => window.open(`http://localhost:5000${msg.attachment}`, '_blank')}
                              />
                            )}
                            
                            {/* Voice attachment */}
                            {msg.attachmentType === 'voice' && msg.attachment && (
                              <audio controls className="max-w-full">
                                <source src={`http://localhost:5000${msg.attachment}`} type="audio/webm" />
                              </audio>
                            )}
                            
                            {/* Text content */}
                            {msg.content && <p>{msg.content}</p>}
                            
                            <div className="text-[10px] opacity-60 mt-1 text-right">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          {/* Reactions */}
                          {msg.reactions?.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {msg.reactions.map((r, i) => (
                                <span key={i} className="text-sm bg-white/20 dark:bg-slate-600/50 rounded-full px-2 py-0.5">{r.emoji}</span>
                              ))}
                            </div>
                          )}
                          
                          {/* Hover reaction bar */}
                          <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition bg-white dark:bg-slate-700 rounded-full shadow-lg p-1 flex gap-1">
                            {['❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(msg._id, emoji)}
                                className="hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full p-1 text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Voice note preview */}
                {audioBlob && (
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 flex items-center gap-3">
                    <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1" />
                    <button onClick={sendVoiceNote} className="px-4 py-2 bg-purple-500 text-white rounded-full font-bold">Send</button>
                    <button onClick={() => setAudioBlob(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                )}
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2 items-center">
                  {/* Emoji */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition text-xl"
                    >
                      😊
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50">
                        <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                      </div>
                    )}
                  </div>
                  
                  {/* Image */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition text-xl"
                  >
                    📷
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {/* Voice */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full transition text-xl ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                  >
                    {isRecording ? '⏹️' : '🎤'}
                  </button>
                  
                  {/* Text Input */}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedFriend.name}...`}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 border-none rounded-full px-4 py-3 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-300 outline-none"
                  />
                  
                  {/* Send */}
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : viewProfile ? (
              /* Friend Profile View - Fetched fresh from API */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
                <button 
                  onClick={() => setViewProfile(null)}
                  className="self-start mb-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                >
                  ← Back to chat
                </button>
                
                {loadingProfile ? (
                  <div className="text-gray-400">Loading profile...</div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
                    <div className="w-28 h-28 mx-auto bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full p-1 shadow-xl mb-4">
                      <div className="w-full h-full bg-white dark:bg-slate-700 rounded-full overflow-hidden flex items-center justify-center">
                        {viewProfile.avatar ? (
                          <img src={`http://localhost:5000${viewProfile.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-4xl font-bold text-gray-300">{viewProfile.name?.[0]}</span>
                        )}
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{viewProfile.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 italic text-sm mt-2 mb-4">
                      "{viewProfile.about || "Hey there! I'm using Limerence 📚"}"
                    </p>
                    
                    {/* Badges */}
                    <div className="mt-6">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Badges</h4>
                      <div className="flex flex-wrap justify-center gap-2">
                        {viewProfile.badges?.map((b, i) => (
                          <div key={i} className="text-2xl p-2 bg-gray-100 dark:bg-slate-700 rounded-lg" title={b.name}>{b.icon || "🏅"}</div>
                        ))}
                        {!viewProfile.badges?.length && <p className="text-xs text-gray-400">No badges yet</p>}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                        <div className="text-2xl font-bold text-purple-500">{viewProfile.shelf?.length || 0}</div>
                        <div className="text-xs text-gray-400">Books</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                        <div className="text-2xl font-bold text-purple-500">{viewProfile.friends?.length || 0}</div>
                        <div className="text-xs text-gray-400">Friends</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-slate-900">
                <span className="text-8xl mb-4">👯</span>
                <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">Select a friend</h3>
                <p className="text-sm">Choose someone to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
