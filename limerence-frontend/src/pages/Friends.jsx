import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { toast } from "../components/Toast";

// Premium Wallpaper Gradients (same as Clubs)
const WALLPAPERS = {
  romantic: "bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-purple-950/30",
  ocean: "bg-gradient-to-br from-cyan-100 via-blue-50 to-indigo-100 dark:from-cyan-950/30 dark:via-blue-950/20 dark:to-indigo-950/30",
  sunset: "bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/30",
  forest: "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-green-950/30 dark:via-emerald-950/20 dark:to-teal-950/30",
  galaxy: "bg-gradient-to-br from-violet-200 via-purple-100 to-indigo-200 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-indigo-950/40",
  midnight: "bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200 dark:from-slate-900 dark:via-gray-900 dark:to-zinc-900",
};

export default function Friends() {
  const { token, user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [conversationTimestamps, setConversationTimestamps] = useState({});
  
  // Per-friend wallpaper settings (stored in localStorage)
  const [friendWallpapers, setFriendWallpapers] = useState(() => {
    const saved = localStorage.getItem("friendWallpapers");
    return saved ? JSON.parse(saved) : {};
  });
  const [friendCustomWallpapers, setFriendCustomWallpapers] = useState(() => {
    const saved = localStorage.getItem("friendCustomWallpapers");
    return saved ? JSON.parse(saved) : {};
  });
  
  const fileInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Avatar colors for users without profile pics
  const avatarColors = [
    "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500",
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
    "bg-cyan-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500",
  ];
  
  const getAvatarColor = (name) => {
    const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return avatarColors[hash % avatarColors.length];
  };

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

  // Save per-friend wallpapers
  useEffect(() => {
    localStorage.setItem("friendWallpapers", JSON.stringify(friendWallpapers));
  }, [friendWallpapers]);
  
  useEffect(() => {
    localStorage.setItem("friendCustomWallpapers", JSON.stringify(friendCustomWallpapers));
  }, [friendCustomWallpapers]);

  const fetchFriends = async () => {
    try {
      const res = await axios.get("/api/users/me", {
        headers: { "x-auth-token": token }
      });
      const friendsList = res.data.friends || [];
      
      // Fetch last message timestamps for sorting
      const timestamps = {};
      const unreads = {};
      for (const friend of friendsList) {
        try {
          const convRes = await axios.get(`/api/dm/${friend._id}`, {
            headers: { "x-auth-token": token }
          });
          const msgs = convRes.data.messages || [];
          if (msgs.length > 0) {
            timestamps[friend._id] = new Date(msgs[msgs.length - 1].createdAt).getTime();
            // Count unread (messages from friend in last 5 min)
            const fiveMinAgo = Date.now() - 300000;
            unreads[friend._id] = msgs.filter(m => 
              (m.sender?._id || m.sender) !== user._id && 
              new Date(m.createdAt).getTime() > fiveMinAgo
            ).length;
          }
        } catch (e) { /* No conversation yet */ }
      }
      setConversationTimestamps(timestamps);
      setUnreadCounts(unreads);
      
      // Sort by recent activity
      friendsList.sort((a, b) => (timestamps[b._id] || 0) - (timestamps[a._id] || 0));
      setFriends(friendsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (friendId) => {
    try {
      const res = await axios.get(`/api/dm/${friendId}`, {
        headers: { "x-auth-token": token }
      });
      setMessages(res.data.messages || []);
      // Clear unread for this friend
      setUnreadCounts(prev => ({ ...prev, [friendId]: 0 }));
    } catch (err) {
      console.error(err);
    }
  };

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

  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Per-friend wallpaper management
  const setWallpaperForFriend = (friendId, wallpaperId) => {
    setFriendWallpapers(prev => ({ ...prev, [friendId]: wallpaperId }));
    // Clear custom wallpaper if selecting preset
    if (wallpaperId !== 'custom') {
      setFriendCustomWallpapers(prev => {
        const newCustom = { ...prev };
        delete newCustom[friendId];
        return newCustom;
      });
    }
    setShowWallpaperPicker(false);
  };

  const handleCustomWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedFriend) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFriendCustomWallpapers(prev => ({ ...prev, [selectedFriend._id]: reader.result }));
        setFriendWallpapers(prev => ({ ...prev, [selectedFriend._id]: 'custom' }));
        setShowWallpaperPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentWallpaper = () => {
    if (!selectedFriend) return WALLPAPERS.romantic;
    const wallpaperId = friendWallpapers[selectedFriend._id] || 'romantic';
    if (wallpaperId === 'custom' && friendCustomWallpapers[selectedFriend._id]) {
      return null; // Will use style instead
    }
    return WALLPAPERS[wallpaperId] || WALLPAPERS.romantic;
  };

  const getCustomWallpaperStyle = () => {
    if (!selectedFriend) return {};
    const wallpaperId = friendWallpapers[selectedFriend._id];
    if (wallpaperId === 'custom' && friendCustomWallpapers[selectedFriend._id]) {
      return { 
        backgroundImage: `url(${friendCustomWallpapers[selectedFriend._id]})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      };
    }
    return {};
  };

  // Handle image selection with preview
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Send image (resized)
  const sendImage = async () => {
    if (!attachment || !selectedFriend) return;
    
    const formData = new FormData();
    formData.append('attachment', attachment);
    formData.append('attachmentType', 'image');
    formData.append('content', newMessage);
    if (replyingTo) {
      formData.append('replyToId', replyingTo._id);
      formData.append('replyToContent', replyingTo.content);
      formData.append('replyToUsername', replyingTo.sender?.name || 'Unknown');
    }
    
    try {
      const res = await axios.post(`/api/dm/${selectedFriend._id}/message`, formData, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
      });
      setMessages(prev => [...prev, res.data]);
      setAttachment(null);
      setImagePreview(null);
      setNewMessage("");
      setReplyingTo(null);
      toast("Sent!", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to send", "error");
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
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
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
      });
      setMessages(prev => [...prev, res.data]);
      setAudioBlob(null);
      toast("Voice note sent!", "success");
    } catch (err) {
      toast("Failed to send voice note", "error");
    }
  };

  // Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    
    try {
      const payload = { content: newMessage };
      if (replyingTo) {
        payload.replyToId = replyingTo._id;
        payload.replyToContent = replyingTo.content;
        payload.replyToUsername = replyingTo.sender?.name || 'Unknown';
      }
      
      const res = await axios.post(`/api/dm/${selectedFriend._id}/message`, payload, {
        headers: { "x-auth-token": token }
      });
      setMessages(prev => [...prev, res.data]);
      setNewMessage("");
      setReplyingTo(null);
    } catch (err) {
      toast("Failed to send", "error");
    }
  };

  // Add reaction
  const addReaction = async (messageId, emoji) => {
    if (!selectedFriend) return;
    try {
      await axios.post(`/api/dm/${selectedFriend._id}/message/${messageId}/reaction`, 
        { emoji }, 
        { headers: { "x-auth-token": token } }
      );
      fetchConversation(selectedFriend._id);
    } catch (err) {
      console.error(err);
    }
  };

  // Get total unread count
  const getTotalUnread = () => Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Message Bubble Component (like Clubs)
  const MessageBubble = ({ msg }) => {
    const senderId = msg.sender?._id || msg.sender;
    const isMe = senderId === user?._id;
    const senderName = msg.sender?.name || 'Unknown';
    const avatarColor = getAvatarColor(senderName);
    
    return (
      <div className={`flex flex-col ${msg.reactions?.length > 0 ? 'mb-6' : 'mb-4'} group ${isMe ? "items-end" : "items-start"} relative`}>
        {/* Reply Context */}
        {msg.replyTo && (
          <div className={`text-xs mb-2 p-2.5 rounded-lg border-l-4 max-w-[70%] bg-gray-100 dark:bg-slate-700 border-gray-400 dark:border-slate-500 text-gray-700 dark:text-gray-200`}>
            <span className="font-bold">{msg.replyTo.username}</span>: {msg.replyTo.content?.substring(0, 40)}...
          </div>
        )}

        <div className="flex gap-2 max-w-[75%]">
          {/* Avatar for friend's messages */}
          {!isMe && (
            <div className={`w-9 h-9 rounded-full ${avatarColor} flex-shrink-0 overflow-hidden shadow-md flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-slate-700`}>
              {msg.sender?.avatar ? (
                <img src={`http://localhost:5000${msg.sender.avatar}`} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-sm font-bold">{senderName?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
          )}
          
          <div className="relative">
            {/* Message Bubble */}
            <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative text-[15px] leading-relaxed break-words ${
              isMe 
                ? "bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white rounded-tr-sm" 
                : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-tl-sm"
            }`}>
              {/* Sender name for friend */}
              {!isMe && (
                <span className="block text-[12px] font-bold mb-0.5 text-purple-600 dark:text-purple-400">
                  {senderName}
                </span>
              )}
              
              {/* Image attachment - RESIZED */}
              {msg.attachmentType === 'image' && msg.attachment && (
                <img 
                  src={`http://localhost:5000${msg.attachment}`} 
                  alt="Shared" 
                  className="max-w-[250px] max-h-[250px] rounded-lg mb-2 cursor-pointer object-cover"
                  onClick={() => window.open(`http://localhost:5000${msg.attachment}`, '_blank')}
                />
              )}
              
              {/* Voice attachment */}
              {msg.attachmentType === 'voice' && msg.attachment && (
                <audio controls className="max-w-[200px]">
                  <source src={`http://localhost:5000${msg.attachment}`} type="audio/webm" />
                </audio>
              )}
              
              {/* Text content */}
              {msg.content && <p>{msg.content}</p>}
              
              {/* Timestamp */}
              <div className="text-[10px] opacity-50 mt-1 text-right">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {/* Reactions Display */}
            {msg.reactions?.length > 0 && (
              <div className="absolute -bottom-5 left-2 flex gap-0.5 bg-white dark:bg-slate-700 rounded-full px-1.5 py-0.5 shadow-md border border-gray-100 dark:border-slate-600">
                {msg.reactions.map((r, i) => (
                  <span key={i} className="text-sm">{r.emoji}</span>
                ))}
              </div>
            )}
            
            {/* Hover Actions */}
            <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-700 rounded-full shadow-lg p-1 flex gap-1 z-20">
              {['❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addReaction(msg._id, emoji)}
                  className="hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full p-1 text-sm"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setReplyingTo(msg)}
                className="hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full p-1 text-sm"
                title="Reply"
              >
                ↩️
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
          {/* Friends List Sidebar */}
          <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Friends</h1>
              {getTotalUnread() > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {getTotalUnread()}
                </span>
              )}
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
                    {/* Avatar with unique color */}
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(friend.name)} flex items-center justify-center text-white font-bold overflow-hidden shrink-0 ring-2 ring-white dark:ring-slate-700`}>
                      {friend.avatar ? (
                        <img src={`http://localhost:5000${friend.avatar}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-lg">{friend.name?.[0]?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-white truncate">{friend.name}</h3>
                      <p className="text-xs text-green-500">Online</p>
                    </div>
                    {/* Unread badge */}
                    {unreadCounts[friend._id] > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadCounts[friend._id]}
                      </span>
                    )}
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
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedFriend.name)} flex items-center justify-center text-white font-bold overflow-hidden`}>
                      {selectedFriend.avatar ? (
                        <img src={`http://localhost:5000${selectedFriend.avatar}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        selectedFriend.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{selectedFriend.name}</h3>
                      <p className="text-xs text-green-500">Tap to view profile</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWallpaperPicker(!showWallpaperPicker);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition"
                  >
                    🎨
                  </button>
                </div>
                
                {/* Wallpaper Picker */}
                {showWallpaperPicker && (
                  <div className="absolute right-20 top-32 bg-white dark:bg-slate-700 rounded-xl shadow-2xl p-4 z-50 border border-gray-200 dark:border-slate-600">
                    <h4 className="text-xs font-bold text-gray-400 mb-3">Choose Wallpaper for {selectedFriend.name}</h4>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {Object.entries(WALLPAPERS).map(([id, cls]) => (
                        <button
                          key={id}
                          onClick={() => setWallpaperForFriend(selectedFriend._id, id)}
                          className={`w-16 h-16 rounded-lg ${cls} ${friendWallpapers[selectedFriend._id] === id ? 'ring-2 ring-purple-500' : ''}`}
                          title={id}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => wallpaperInputRef.current?.click()}
                      className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600 transition"
                    >
                      📷 Upload Custom
                    </button>
                    <input type="file" ref={wallpaperInputRef} onChange={handleCustomWallpaperUpload} accept="image/*" className="hidden" />
                  </div>
                )}
                
                {/* Messages Area */}
                <div 
                  className={`flex-1 p-4 overflow-y-auto ${getCurrentWallpaper() || ''}`}
                  style={getCustomWallpaperStyle()}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <span className="text-6xl mb-3">💬</span>
                      <p className="text-lg font-bold">Start a conversation</p>
                      <p className="text-sm opacity-75">Say hi to {selectedFriend.name}!</p>
                    </div>
                  ) : (
                    messages.map((msg) => <MessageBubble key={msg._id} msg={msg} />)
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 flex items-center justify-between border-t border-gray-200 dark:border-slate-600">
                    <div className="flex-1 text-sm">
                      <span className="text-gray-400">Replying to </span>
                      <span className="font-bold text-purple-500">{replyingTo.sender?.name}</span>
                      <p className="text-gray-500 truncate">{replyingTo.content?.substring(0, 50)}...</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                  </div>
                )}
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 py-3 bg-gray-100 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Add a caption..."
                          className="w-full bg-transparent border-none text-gray-800 dark:text-white placeholder-gray-400 outline-none"
                        />
                      </div>
                      <button onClick={sendImage} className="px-4 py-2 bg-purple-500 text-white rounded-full font-bold">Send</button>
                      <button onClick={() => { setAttachment(null); setImagePreview(null); }} className="text-gray-400">✕</button>
                    </div>
                  </div>
                )}
                
                {/* Voice Preview */}
                {audioBlob && (
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 flex items-center gap-3 border-t">
                    <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1" />
                    <button onClick={sendVoiceNote} className="px-4 py-2 bg-purple-500 text-white rounded-full font-bold">Send</button>
                    <button onClick={() => setAudioBlob(null)} className="text-gray-500">✕</button>
                  </div>
                )}
                
                {/* Message Input */}
                {!imagePreview && (
                  <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2 items-center">
                    <div className="relative">
                      <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-xl">😊</button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50">
                          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                        </div>
                      )}
                    </div>
                    
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-xl">📷</button>
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2 rounded-full text-xl ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                      {isRecording ? '⏹️' : '🎤'}
                    </button>
                    
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedFriend.name}...`}
                      className="flex-1 bg-gray-100 dark:bg-slate-700 border-none rounded-full px-4 py-3 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-300 outline-none"
                    />
                    
                    <button type="submit" disabled={!newMessage.trim()} className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 disabled:opacity-50">Send</button>
                  </form>
                )}
              </>
            ) : viewProfile ? (
              /* Profile View */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
                <button onClick={() => setViewProfile(null)} className="self-start mb-4 text-gray-400 hover:text-gray-600 dark:hover:text-white">← Back to chat</button>
                
                {loadingProfile ? (
                  <div className="text-gray-400">Loading profile...</div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
                    <div className={`w-28 h-28 mx-auto ${getAvatarColor(viewProfile.name)} rounded-full p-1 shadow-xl mb-4`}>
                      <div className="w-full h-full bg-white dark:bg-slate-700 rounded-full overflow-hidden flex items-center justify-center">
                        {viewProfile.avatar ? (
                          <img src={`http://localhost:5000${viewProfile.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-4xl font-bold text-gray-300">{viewProfile.name?.[0]}</span>
                        )}
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{viewProfile.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 italic text-sm mt-2 mb-4">"{viewProfile.about || "Hey there! I'm using Limerence 📚"}"</p>
                    
                    <div className="mt-6">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Badges</h4>
                      <div className="flex flex-wrap justify-center gap-2">
                        {viewProfile.badges?.map((b, i) => (
                          <div key={i} className="text-2xl p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">{b.icon || "🏅"}</div>
                        ))}
                        {!viewProfile.badges?.length && <p className="text-xs text-gray-400">No badges yet</p>}
                      </div>
                    </div>
                    
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
