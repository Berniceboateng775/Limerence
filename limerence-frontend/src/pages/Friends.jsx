import React, { useContext, useEffect, useState, useRef } from "react";
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
  const [lastMessages, setLastMessages] = useState({}); // For WhatsApp-style preview in list
  const [showReactionPicker, setShowReactionPicker] = useState(null); // Which message to show picker for
  const [joinClubModal, setJoinClubModal] = useState(null); // Club join popup: { clubId, clubName, loading }
  
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

  useEffect(() => { fetchFriends(); }, []);

  useEffect(() => {
    if (selectedFriend) fetchConversation(selectedFriend._id);
  }, [selectedFriend]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { localStorage.setItem("friendWallpapers", JSON.stringify(friendWallpapers)); }, [friendWallpapers]);
  useEffect(() => { localStorage.setItem("friendCustomWallpapers", JSON.stringify(friendCustomWallpapers)); }, [friendCustomWallpapers]);

  const fetchFriends = async () => {
    try {
      const res = await axios.get("/api/users/me", { headers: { "x-auth-token": token } });
      const friendsList = res.data.friends || [];
      
      const timestamps = {};
      const unreads = {};
      const lastMsgs = {};
      
      for (const friend of friendsList) {
        try {
          const convRes = await axios.get(`/api/dm/${friend._id}`, { headers: { "x-auth-token": token } });
          const msgs = convRes.data.messages || [];
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            timestamps[friend._id] = new Date(lastMsg.createdAt).getTime();
            lastMsgs[friend._id] = {
              content: lastMsg.content || (lastMsg.attachmentType === 'image' ? '📷 Photo' : lastMsg.attachmentType === 'voice' ? '🎤 Voice message' : ''),
              time: new Date(lastMsg.createdAt),
              isMe: (lastMsg.sender?._id || lastMsg.sender) === user._id
            };
            // Count unread - ONLY messages FROM friend (not from me!)
            const fiveMinAgo = Date.now() - 300000;
            unreads[friend._id] = msgs.filter(m => 
              (m.sender?._id || m.sender) !== user._id && 
              new Date(m.createdAt).getTime() > fiveMinAgo
            ).length;
          }
        } catch (e) { /* No conversation */ }
      }
      
      setLastMessages(lastMsgs);
      setUnreadCounts(unreads);
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
      const res = await axios.get(`/api/dm/${friendId}`, { headers: { "x-auth-token": token } });
      setMessages(res.data.messages || []);
      setUnreadCounts(prev => ({ ...prev, [friendId]: 0 }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriendProfile = async (friendId) => {
    setLoadingProfile(true);
    try {
      const res = await axios.get(`/api/users/${friendId}`, { headers: { "x-auth-token": token } });
      setViewProfile(res.data);
    } catch (err) {
      toast("Failed to load profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const setWallpaperForFriend = (friendId, wallpaperId) => {
    setFriendWallpapers(prev => ({ ...prev, [friendId]: wallpaperId }));
    if (wallpaperId !== 'custom') {
      setFriendCustomWallpapers(prev => { const n = { ...prev }; delete n[friendId]; return n; });
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
    const wpId = friendWallpapers[selectedFriend._id] || 'romantic';
    if (wpId === 'custom' && friendCustomWallpapers[selectedFriend._id]) return null;
    return WALLPAPERS[wpId] || WALLPAPERS.romantic;
  };

  const getCustomWallpaperStyle = () => {
    if (!selectedFriend) return {};
    const wpId = friendWallpapers[selectedFriend._id];
    if (wpId === 'custom' && friendCustomWallpapers[selectedFriend._id]) {
      return { backgroundImage: `url(${friendCustomWallpapers[selectedFriend._id]})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return {};
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

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
      setAttachment(null); setImagePreview(null); setNewMessage(""); setReplyingTo(null);
      toast("Sent!", "success");
    } catch (err) {
      toast("Failed to send", "error");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
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
      toast("Failed to send", "error");
    }
  };

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
      const res = await axios.post(`/api/dm/${selectedFriend._id}/message`, payload, { headers: { "x-auth-token": token } });
      setMessages(prev => [...prev, res.data]);
      setNewMessage(""); setReplyingTo(null);
    } catch (err) {
      toast("Failed to send", "error");
    }
  };

  const addReaction = async (messageId, emoji) => {
    if (!selectedFriend) return;
    try {
      await axios.post(`/api/dm/${selectedFriend._id}/message/${messageId}/reaction`, { emoji }, { headers: { "x-auth-token": token } });
      fetchConversation(selectedFriend._id);
      setShowReactionPicker(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getTotalUnread = () => Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Message Bubble Component
  const MessageBubble = ({ msg }) => {
    const senderId = msg.sender?._id || msg.sender;
    const isMe = senderId === user?._id;
    const senderName = msg.sender?.name || 'Unknown';
    const avatarColor = getAvatarColor(senderName);
    const isReactionPickerOpen = showReactionPicker === msg._id;
    
    // Helper to make URLs clickable - detect club join links
    const renderWithLinks = (text) => {
      if (!text) return null;
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);
      return parts.map((part, i) => {
        if (urlRegex.test(part)) {
          // Reset regex lastIndex
          urlRegex.lastIndex = 0;
          
          // Check if this is a club join link
          if (part.includes('/clubs?join=')) {
            const clubId = new URL(part).searchParams.get('join');
            return (
              <button 
                key={i} 
                className="underline text-blue-300 hover:text-blue-200 break-all"
                onClick={async (e) => {
                  e.stopPropagation();
                  // Show join popup
                  try {
                    setJoinClubModal({ clubId, loading: true });
                    const res = await axios.get("/api/clubs", { headers: { "x-auth-token": token } });
                    const club = res.data.find(c => c._id === clubId);
                    if (club) {
                      setJoinClubModal({ clubId, club, loading: false });
                    } else {
                      toast("Club not found", "error");
                      setJoinClubModal(null);
                    }
                  } catch (err) {
                    toast("Failed to load club", "error");
                    setJoinClubModal(null);
                  }
                }}
              >
                {part}
              </button>
            );
          }
          
          return (
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline text-blue-300 hover:text-blue-200 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      });
    };
    
    return (
      <div className={`flex flex-col mb-3 group ${isMe ? "items-end" : "items-start"} relative`}>
        {msg.replyTo && (
          <div className="text-xs mb-2 p-2.5 rounded-lg border-l-4 max-w-[70%] bg-gray-100 dark:bg-slate-700 border-gray-400 dark:border-slate-500 text-gray-700 dark:text-gray-200">
            <span className="font-bold">{msg.replyTo.username}</span>: {msg.replyTo.content?.substring(0, 40)}...
          </div>
        )}

        <div className="flex gap-2 max-w-[75%]">
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
            <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative text-[15px] leading-relaxed break-words ${
              isMe ? "bg-purple-500 text-white rounded-br-sm" : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm shadow-lg"
            }`}>
              {!isMe && <span className="block text-[12px] font-bold mb-0.5 text-purple-600 dark:text-purple-400">{senderName}</span>}
              
              {msg.attachmentType === 'image' && msg.attachment && (
                <img src={`http://localhost:5000${msg.attachment}`} alt="Shared" 
                  className="max-w-[200px] max-h-[200px] rounded-lg mb-2 cursor-pointer object-cover"
                  onClick={() => window.open(`http://localhost:5000${msg.attachment}`, '_blank')}
                />
              )}
              
              {msg.attachmentType === 'voice' && msg.attachment && (
                <audio controls className="max-w-[180px]"><source src={`http://localhost:5000${msg.attachment}`} type="audio/webm" /></audio>
              )}
              
              {msg.content && <p>{renderWithLinks(msg.content)}</p>}
              
              <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-purple-200' : 'opacity-50'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {/* Reactions Display - Inline below bubble */}
            {msg.reactions?.length > 0 && (
              <div className="flex gap-0.5 bg-white dark:bg-slate-600 rounded-full px-2 py-1 shadow-md mt-1 w-fit">
                {msg.reactions.map((r, i) => <span key={i} className="text-sm">{r.emoji}</span>)}
                <span className="text-xs text-gray-500 dark:text-gray-300 ml-1">{msg.reactions.length}</span>
              </div>
            )}
            
            {/* Hover Actions Bar - Stays within container bounds */}
            <div className={`absolute ${isMe ? 'right-full mr-1' : 'left-full ml-1'} top-1 opacity-0 group-hover:opacity-100 transition-all bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 p-1 flex gap-0.5 z-30`}>
              {['❤️', '😂', '😮', '👍', '😢'].map(emoji => (
                <button key={emoji} onClick={() => addReaction(msg._id, emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg text-lg transition">
                  {emoji}
                </button>
              ))}
              <button onClick={() => setShowReactionPicker(isReactionPickerOpen ? null : msg._id)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg text-lg transition border-l border-gray-200 dark:border-slate-600">
                ➕
              </button>
              <button onClick={() => setReplyingTo(msg)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg text-lg transition" title="Reply">
                ↩️
              </button>
            </div>

            {/* Full Emoji Picker */}
            {isReactionPickerOpen && (
              <div className="absolute bottom-full left-0 z-50 mb-2">
                <EmojiPicker onEmojiClick={(e) => addReaction(msg._id, e.emoji)} theme="dark" height={350} />
              </div>
            )}
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-0 transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 h-[calc(100vh-80px)]">
        <div className="flex gap-0 h-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700">
          
          {/* Friends List Sidebar - WhatsApp Style */}
          <div className="w-96 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-purple-600 to-pink-500">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-serif font-bold text-white">Chats</h1>
                {getTotalUnread() > 0 && (
                  <span className="bg-white text-purple-600 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    {getTotalUnread()} new
                  </span>
                )}
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {friends.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <span className="text-6xl block mb-4">💬</span>
                  <p className="font-bold text-lg">No chats yet!</p>
                  <p className="text-sm mt-2 opacity-75">Visit Clubs to meet readers and make friends</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => { setSelectedFriend(friend); setViewProfile(null); }}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 border-b border-gray-50 dark:border-slate-700/50 ${
                      selectedFriend?._id === friend._id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    {/* Avatar with online dot */}
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full ${getAvatarColor(friend.name)} flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-lg`}>
                        {friend.avatar ? (
                          <img src={`http://localhost:5000${friend.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : (
                          friend.name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    </div>
                    
                    {/* Name + Last Message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{friend.name}</h3>
                        {lastMessages[friend._id] && (
                          <span className={`text-xs ${unreadCounts[friend._id] > 0 ? 'text-purple-500 font-bold' : 'text-gray-400'}`}>
                            {formatTime(lastMessages[friend._id].time)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-sm truncate ${unreadCounts[friend._id] > 0 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500'}`}>
                          {lastMessages[friend._id] ? (
                            <>
                              {lastMessages[friend._id].isMe && <span className="text-purple-500">You: </span>}
                              {lastMessages[friend._id].content?.substring(0, 30) || '...'}
                              {lastMessages[friend._id].content?.length > 30 ? '...' : ''}
                            </>
                          ) : (
                            <span className="italic text-gray-400">Start a conversation</span>
                          )}
                        </p>
                        {unreadCounts[friend._id] > 0 && (
                          <span className="bg-purple-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ml-2">
                            {unreadCounts[friend._id]}
                          </span>
                        )}
                      </div>
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
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-full ${getAvatarColor(selectedFriend.name)} flex items-center justify-center text-white font-bold overflow-hidden shadow`}>
                        {selectedFriend.avatar ? (
                          <img src={`http://localhost:5000${selectedFriend.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : selectedFriend.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{selectedFriend.name}</h3>
                      <p className="text-xs text-green-500">Online • Tap for info</p>
                    </div>
                  </div>
                  
                  <button onClick={(e) => { e.stopPropagation(); setShowWallpaperPicker(!showWallpaperPicker); }}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition text-xl">
                    🎨
                  </button>
                </div>
                
                {/* Wallpaper Picker */}
                {showWallpaperPicker && (
                  <div className="absolute right-20 top-32 bg-white dark:bg-slate-700 rounded-xl shadow-2xl p-4 z-50 border border-gray-200 dark:border-slate-600">
                    <h4 className="text-xs font-bold text-gray-400 mb-3">Wallpaper for {selectedFriend.name}</h4>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {Object.entries(WALLPAPERS).map(([id, cls]) => (
                        <button key={id} onClick={() => setWallpaperForFriend(selectedFriend._id, id)}
                          className={`w-16 h-16 rounded-lg ${cls} ${friendWallpapers[selectedFriend._id] === id ? 'ring-2 ring-purple-500' : ''}`} title={id} />
                      ))}
                    </div>
                    <button onClick={() => wallpaperInputRef.current?.click()}
                      className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600 transition">
                      📷 Upload Custom
                    </button>
                    <input type="file" ref={wallpaperInputRef} onChange={handleCustomWallpaperUpload} accept="image/*" className="hidden" />
                  </div>
                )}
                
                {/* Messages Area */}
                <div className={`flex-1 p-4 overflow-y-auto overflow-x-hidden ${getCurrentWallpaper() || ''}`} style={getCustomWallpaperStyle()}>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                        <span className="text-5xl">👋</span>
                      </div>
                      <p className="text-lg font-bold">Say hello to {selectedFriend.name}!</p>
                      <p className="text-sm opacity-75 mt-1">Send a message to start chatting</p>
                    </div>
                  ) : (
                    messages.map((msg) => <MessageBubble key={msg._id} msg={msg} />)
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between border-t-2 border-purple-500">
                    <div className="flex-1 text-sm">
                      <span className="text-purple-500 font-bold">↩ Replying to {replyingTo.sender?.name}</span>
                      <p className="text-gray-500 truncate">{replyingTo.content?.substring(0, 50)}...</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
                  </div>
                )}
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 py-3 bg-gray-100 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg shadow" />
                      <div className="flex-1">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Add a caption..." className="w-full bg-transparent border-none text-gray-800 dark:text-white placeholder-gray-400 outline-none" />
                      </div>
                      <button onClick={sendImage} className="px-4 py-2 bg-purple-500 text-white rounded-full font-bold">Send</button>
                      <button onClick={() => { setAttachment(null); setImagePreview(null); }} className="text-gray-400 text-xl">✕</button>
                    </div>
                  </div>
                )}
                
                {/* Voice Preview */}
                {audioBlob && (
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 flex items-center gap-3 border-t">
                    <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1" />
                    <button onClick={sendVoiceNote} className="px-4 py-2 bg-purple-500 text-white rounded-full font-bold">Send</button>
                    <button onClick={() => setAudioBlob(null)} className="text-gray-500 text-xl">✕</button>
                  </div>
                )}
                
                {/* Message Input */}
                {!imagePreview && (
                  <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2 items-center">
                    <div className="relative">
                      <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-xl">😊</button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-14 left-0 z-50"><EmojiPicker onEmojiClick={onEmojiClick} theme="dark" /></div>
                      )}
                    </div>
                    
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-xl">📷</button>
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    
                    <button type="button" onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2.5 rounded-full text-xl ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                      {isRecording ? '⏹️' : '🎤'}
                    </button>
                    
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                      className="flex-1 bg-gray-100 dark:bg-slate-700 border-none rounded-full px-5 py-3 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 outline-none" />
                    
                    <button type="submit" disabled={!newMessage.trim()} 
                      className="w-12 h-12 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center text-xl shadow-lg">
                      ➤
                    </button>
                  </form>
                )}
              </>
            ) : viewProfile ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
                <button onClick={() => setViewProfile(null)} className="self-start mb-4 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center gap-2">
                  <span>←</span> Back to chat
                </button>
                
                {loadingProfile ? (
                  <div className="text-gray-400">Loading profile...</div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
                    <div className={`w-28 h-28 mx-auto ${getAvatarColor(viewProfile.name)} rounded-full p-1 shadow-xl mb-4`}>
                      <div className="w-full h-full bg-white dark:bg-slate-700 rounded-full overflow-hidden flex items-center justify-center">
                        {viewProfile.avatar ? (
                          <img src={`http://localhost:5000${viewProfile.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : <span className="text-4xl font-bold text-gray-300">{viewProfile.name?.[0]}</span>}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{viewProfile.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 italic text-sm mt-2 mb-4">"{viewProfile.about || "Hey there! I'm using Limerence 📚"}"</p>
                    
                    <div className="mt-6">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Badges</h4>
                      <div className="flex flex-wrap justify-center gap-2">
                        {viewProfile.badges?.map((b, i) => <div key={i} className="text-2xl p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">{b.icon || "🏅"}</div>)}
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
                <div className="w-32 h-32 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                  <span className="text-6xl">💬</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">Select a chat</h3>
                <p className="text-sm mt-2">Choose a friend from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Club Modal - When clicking club link in DM */}
      {joinClubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            {joinClubModal.loading ? (
              <div className="text-gray-400 py-8">Loading club...</div>
            ) : joinClubModal.club ? (
              <>
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden mb-4">
                  {joinClubModal.club.coverImage ? (
                    <img src={`http://localhost:5000${joinClubModal.club.coverImage}`} className="w-full h-full object-cover" alt="" />
                  ) : joinClubModal.club.name?.[0]}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{joinClubModal.club.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{joinClubModal.club.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{joinClubModal.club.members?.length} members</p>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setJoinClubModal(null)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await axios.post(`/api/clubs/${joinClubModal.clubId}/join`, {}, 
                          { headers: { "x-auth-token": token } }
                        );
                        toast("Joined club successfully!", "success");
                        setJoinClubModal(null);
                      } catch (err) {
                        toast(err.response?.data?.msg || "Failed to join club", "error");
                        setJoinClubModal(null);
                      }
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition"
                  >
                    Join Club
                  </button>
                </div>
              </>
            ) : (
              <div className="text-gray-400 py-8">Club not found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
