import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "../components/Toast";
import EmojiPicker from "emoji-picker-react";

export default function Clubs() {
  const { token, user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [viewProfile, setViewProfile] = useState(null); 
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Forms
  const [clubForm, setClubForm] = useState({ name: "", description: "", currentBook: "" });

  // Chat State
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatTheme, setChatTheme] = useState(localStorage.getItem("chatTheme") || "romantic");
  const [customWallpaper, setCustomWallpaper] = useState(localStorage.getItem("customWallpaper") || null);
  const [fontSize, setFontSize] = useState(localStorage.getItem("chatFontSize") || "medium");
  
  const messagesEndRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Premium Wallpaper Gradients
  const wallpapers = {
    romantic: "bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-purple-950/30",
    ocean: "bg-gradient-to-br from-cyan-100 via-blue-50 to-indigo-100 dark:from-cyan-950/30 dark:via-blue-950/20 dark:to-indigo-950/30",
    sunset: "bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/30",
    forest: "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-green-950/30 dark:via-emerald-950/20 dark:to-teal-950/30",
    galaxy: "bg-gradient-to-br from-violet-200 via-purple-100 to-indigo-200 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-indigo-950/40",
    midnight: "bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200 dark:from-slate-900 dark:via-gray-900 dark:to-zinc-900",
    lavender: "bg-gradient-to-br from-purple-100 via-violet-50 to-fuchsia-100 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-fuchsia-950/30",
  };

  // Font sizes
  const fontSizes = {
    small: "text-[13px]",
    medium: "text-[15px]",
    large: "text-[17px]",
    xlarge: "text-[19px]"
  };

  // Save preferences
  useEffect(() => {
    localStorage.setItem("chatTheme", chatTheme);
    localStorage.setItem("chatFontSize", fontSize);
  }, [chatTheme, fontSize]);

  const fetchClubs = useCallback(async () => {
    try {
      const res = await axios.get("/api/clubs");
      setClubs(res.data);
      // Update selected club if it exists
      if (selectedClub) {
        const updated = res.data.find(c => c._id === selectedClub._id);
        if (updated) setSelectedClub(updated);
      }
    } catch (err) { console.error(err); }
  }, [selectedClub]);

  useEffect(() => {
    fetchClubs();
    const interval = setInterval(fetchClubs, 15000); // Reduced from 5s to 15s to prevent blinking
    return () => clearInterval(interval);
  }, []);

  // Scroll to first unread or bottom when opening chat
  useEffect(() => {
    if (selectedClub && chatContainerRef.current) {
      if (firstUnreadRef.current) {
        firstUnreadRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      markAsRead(selectedClub._id);
    }
  }, [selectedClub?._id]);

  const markAsRead = async (clubId) => {
    try { 
      await axios.post(`/api/clubs/${clubId}/read`, {}, { headers: { "x-auth-token": token } }); 
    } catch (e) { console.error(e); }
  };

  const calculateUnread = (club) => {
    const stats = club.memberStats?.find(s => s.user === user._id || s.user?._id === user._id);
    const lastRead = stats ? new Date(stats.lastReadAt).getTime() : 0;
    return club.messages.filter(m => {
      const senderId = m.user?._id || m.user;
      const isMe = senderId === user._id;
      return !isMe && new Date(m.createdAt).getTime() > lastRead;
    }).length;
  };

  const getFirstUnreadIndex = (club) => {
    const stats = club.memberStats?.find(s => s.user === user._id || s.user?._id === user._id);
    const lastRead = stats ? new Date(stats.lastReadAt).getTime() : 0;
    return club.messages.findIndex(m => {
      const senderId = m.user?._id || m.user;
      const isMe = senderId === user._id;
      return !isMe && new Date(m.createdAt).getTime() > lastRead;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !attachment) return;

    // Optimistic update
    const tempMsg = {
      _id: Date.now().toString(),
      user: user._id,
      username: user.name,
      content: message,
      createdAt: new Date().toISOString(),
      reactions: [],
      pending: true
    };

    setSelectedClub(prev => ({
      ...prev,
      messages: [...(prev.messages || []), tempMsg]
    }));
    
    const msgContent = message;
    setMessage("");
    setShowEmojiPicker(false);
    
    // Scroll to bottom
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const formData = new FormData();
      formData.append("content", msgContent);
      formData.append("username", user.name);
      if (attachment) formData.append("attachment", attachment);
      if (replyingTo) formData.append("replyTo", JSON.stringify(replyingTo));

      await axios.post(`/api/clubs/${selectedClub._id}/message`, formData, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
      });
      
      setAttachment(null);
      setReplyingTo(null);
      markAsRead(selectedClub._id);
      fetchClubs(); 
    } catch (err) { 
      console.error(err); 
      toast("Failed to send", "error"); 
    }
  };

  const handleSubmitClub = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", clubForm.name);
      formData.append("description", clubForm.description);
      formData.append("currentBook", clubForm.currentBook);
      if (clubForm.coverImageFile) {
        formData.append("coverImage", clubForm.coverImageFile);
      }

      if (showEditModal && selectedClub) {
        await axios.put(`/api/clubs/${selectedClub._id}`, formData, { 
          headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" } 
        });
        toast("Club updated!", "success");
        setShowEditModal(false);
      } else {
        await axios.post("/api/clubs", formData, { 
          headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" } 
        });
        toast("Club created!", "success");
        setShowCreateModal(false);
      }
      setClubForm({ name: "", description: "", currentBook: "", coverImageFile: null });
      fetchClubs();
    } catch (err) {
      toast("Operation failed", "error");
    }
  };

  const openEdit = () => {
    setClubForm({
      name: selectedClub.name,
      description: selectedClub.description,
      currentBook: selectedClub.currentBook?.title || ""
    });
    setShowEditModal(true);
  };

  const handleReaction = async (msgId, emoji) => {
    // Optimistic update
    setSelectedClub(prev => ({
      ...prev,
      messages: prev.messages.map(m => 
        m._id === msgId 
          ? { ...m, reactions: [...(m.reactions || []), { user: user._id, emoji }] }
          : m
      )
    }));
    setReactionTarget(null);
    
    try {
      await axios.post(`/api/clubs/${selectedClub._id}/messages/${msgId}/react`, { emoji }, {
        headers: { "x-auth-token": token }
      });
      fetchClubs();
    } catch (e) { 
      console.error(e); 
      toast("Reaction failed", "error");
      fetchClubs(); // Revert on error
    }
  };

  const handleJoin = async (id) => {
    try {
      await axios.post(`/api/clubs/${id}/join`, {}, { headers: { "x-auth-token": token } });
      fetchClubs();
      toast("Joined!", "success");
    } catch (err) { toast("Failed", "error"); }
  };

  const handleFileSelect = (e) => { if (e.target.files[0]) setAttachment(e.target.files[0]); };

  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomWallpaper(reader.result);
        localStorage.setItem("customWallpaper", reader.result);
        setChatTheme("custom");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCustomWallpaper = () => {
    setCustomWallpaper(null);
    localStorage.removeItem("customWallpaper");
    setChatTheme("romantic");
  };

  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate name colors to distinguish users - WhatsApp style (bubble is same gray for all, only NAME is colored)
  const getNameColor = (name) => {
    const nameColors = [
      "text-blue-600 dark:text-blue-400",
      "text-green-600 dark:text-green-400",
      "text-orange-600 dark:text-orange-400",
      "text-purple-600 dark:text-purple-400",
      "text-pink-600 dark:text-pink-400",
      "text-teal-600 dark:text-teal-400",
      "text-indigo-600 dark:text-indigo-400",
      "text-rose-600 dark:text-rose-400",
    ];
    const avatarColors = [
      "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500",
      "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
    ];
    const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return {
      name: nameColors[hash % nameColors.length],
      avatar: avatarColors[hash % avatarColors.length]
    };
  };

  // --- UI COMPONENTS ---
  const MessageBubble = ({ msg, isFirstUnread }) => {
    const senderId = msg.user?._id || msg.user;
    const isMe = senderId === user._id;
    const userColors = getNameColor(msg.username);
    
    return (
      <div 
        ref={isFirstUnread ? firstUnreadRef : null}
        className={`flex flex-col ${msg.reactions?.length > 0 ? 'mb-6' : 'mb-4'} group ${isMe ? "items-end" : "items-start"} relative animate-fade-in`}
      >
        {/* Show "New Messages" divider */}
        {isFirstUnread && (
          <div className="w-full flex items-center justify-center my-4">
            <div className="flex-1 h-px bg-red-300 dark:bg-red-700"></div>
            <span className="px-3 text-xs font-bold text-red-500 dark:text-red-400">NEW MESSAGES</span>
            <div className="flex-1 h-px bg-red-300 dark:bg-red-700"></div>
          </div>
        )}

        {/* Reply Context - NOT blurry, solid background */}
        {msg.replyTo && (
          <div className={`text-xs mb-2 p-2.5 rounded-lg border-l-4 max-w-[70%] ${
            isMe 
              ? "bg-gray-100 dark:bg-slate-700 border-gray-400 dark:border-slate-500 text-gray-700 dark:text-gray-200" 
              : "bg-gray-100 dark:bg-slate-700 border-gray-400 dark:border-slate-500 text-gray-700 dark:text-gray-200"
          }`}>
            <span className="font-bold">{msg.replyTo.username}</span>: {msg.replyTo.content?.substring(0, 40)}...
          </div>
        )}

        <div className="flex gap-2 max-w-[75%]">
          {/* Avatar for others' messages */}
          {!isMe && (
            <div 
              onClick={() => setViewProfile(msg.user)} 
              className={`w-9 h-9 rounded-full ${userColors.avatar} flex-shrink-0 cursor-pointer overflow-hidden shadow-md flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-slate-700`}
            >
              {msg.user?.avatar ? (
                <img src={`http://localhost:5000${msg.user.avatar}`} onError={(e) => e.target.style.display='none'} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-sm font-bold">{msg.username?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
          )}
          
          <div className="relative">
            {/* Message Bubble - SAME GRAY FOR ALL, only names different */}
            <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${fontSizes[fontSize]} leading-relaxed break-words ${
              isMe 
                ? "bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white rounded-tr-sm" 
                : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-tl-sm"
            }`}>
              {/* Show sender name for others - THIS IS THE COLORED PART */}
              {!isMe && (
                <span 
                  className={`block text-[12px] font-bold mb-0.5 cursor-pointer hover:underline ${userColors.name}`}
                  onClick={() => setViewProfile(msg.user)}
                >
                  {msg.username}
                </span>
              )}
              
              {/* Attachment */}
              {msg.attachment && (
                <div className="mb-2">
                  {msg.attachment.fileType === 'image' ? (
                    <img src={`http://localhost:5000${msg.attachment.url}`} className="rounded-lg max-h-48 object-cover" alt="" />
                  ) : (
                    <div className="bg-black/10 p-2 rounded flex items-center gap-2">📄 {msg.attachment.name}</div>
                  )}
                </div>
              )}
              
              {/* Message content */}
              <span className={msg.pending ? "opacity-70" : ""}>{msg.content}</span>
              
              {/* Timestamp */}
              <span className={`text-[10px] opacity-70 block mt-1 text-right ${isMe ? "" : ""}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                {msg.pending && " • Sending..."}
              </span>
            </div>

            {/* Reactions display */}
            {msg.reactions?.length > 0 && (
              <div className={`absolute -bottom-2 ${isMe ? "right-2" : "left-2"} flex gap-0.5 bg-white dark:bg-slate-700 shadow-md rounded-full px-1.5 py-0.5 border border-gray-100 dark:border-slate-600 z-10`}>
                {[...new Set(msg.reactions.map(r => r.emoji))].slice(0, 5).map((emoji, i) => (
                  <span key={i} className="text-xs">{emoji}</span>
                ))}
                {msg.reactions.length > 1 && <span className="text-xs text-gray-500 ml-0.5">{msg.reactions.length}</span>}
              </div>
            )}

            {/* Hover actions */}
            <div className={`absolute top-0 ${isMe ? "-left-24" : "-right-24"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 bg-white dark:bg-slate-700 p-1 rounded-full shadow-lg border dark:border-slate-600 z-20`}>
              <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full text-sm" title="Reply">↩️</button>
              <button onClick={() => handleReaction(msg._id, "❤️")} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-sm">❤️</button>
              <button onClick={() => handleReaction(msg._id, "👍")} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full text-sm">👍</button>
              <button onClick={() => handleReaction(msg._id, "😂")} className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-full text-sm">😂</button>
              <button onClick={() => setReactionTarget(reactionTarget === msg._id ? null : msg._id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full text-sm">➕</button>
            </div>
            
            {/* Full Emoji Picker */}
            {reactionTarget === msg._id && (
              <div className={`fixed z-[100] ${isMe ? "right-[400px]" : "left-[400px]"} top-1/2 -translate-y-1/2`}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border dark:border-slate-700">
                  <div className="flex justify-between items-center p-2 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Choose Reaction</span>
                    <button onClick={() => setReactionTarget(null)} className="text-gray-400 hover:text-red-500 font-bold px-2">×</button>
                  </div>
                  <EmojiPicker 
                    width={320} 
                    height={350} 
                    theme={theme}
                    previewConfig={{ showPreview: false }}
                    onEmojiClick={(e) => handleReaction(msg._id, e.emoji)} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden font-sans bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        
      {/* LEFT SIDEBAR: CLUB LIST */}
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col z-20 shadow-lg">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">Community</h2>
            <button 
              onClick={() => { setClubForm({name:"",description:"",currentBook:""}); setShowCreateModal(true); }} 
              className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900 flex items-center justify-center font-bold text-xl transition"
            >
              +
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Search clubs..." 
            className="w-full bg-gray-100 dark:bg-slate-700 border-none p-2.5 px-4 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 outline-none dark:text-white dark:placeholder-gray-400 transition"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Club List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredClubs.map(club => {
            const unread = calculateUnread(club);
            const isMember = club.members.some(m => (m._id || m) === user._id);
            const lastMsg = club.messages?.[club.messages.length - 1];
            
            return (
              <div 
                key={club._id} 
                onClick={() => isMember ? setSelectedClub(club) : handleJoin(club._id)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                  selectedClub?._id === club._id 
                    ? "bg-purple-50 dark:bg-purple-900/30 ring-1 ring-purple-200 dark:ring-purple-700" 
                    : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                {/* Club Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 shadow-md">
                  {club.coverImage ? (
                    <img src={`http://localhost:5000${club.coverImage}`} className="w-full h-full object-cover" alt="" /> 
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
                      {club.name[0]}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{club.name}</h4>
                    {lastMsg && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {lastMsg ? `${lastMsg.username}: ${lastMsg.content?.substring(0, 25)}${lastMsg.content?.length > 25 ? '...' : ''}` : club.description}
                  </p>
                </div>
                
                {/* Badges */}
                <div className="flex flex-col items-end gap-1">
                  {!isMember && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">Join</span>}
                  {unread > 0 && isMember && (
                    <span className="min-w-[20px] h-5 rounded-full bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER: CHAT AREA */}
      <div className="flex-1 flex flex-col relative">
        {selectedClub ? (
          <>
            {/* Chat Header */}
            <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewProfile(selectedClub)}>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-bold text-white overflow-hidden shadow-md">
                  {selectedClub.coverImage ? (
                    <img src={`http://localhost:5000${selectedClub.coverImage}`} className="w-full h-full object-cover" alt="" />
                  ) : selectedClub.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{selectedClub.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedClub.members.length} members</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Font Size */}
                <select 
                  className="text-xs border-none bg-gray-100 dark:bg-slate-700 rounded-lg p-1.5 outline-none cursor-pointer dark:text-white" 
                  value={fontSize} 
                  onChange={e => setFontSize(e.target.value)}
                  title="Font Size"
                >
                  <option value="small">Aa Small</option>
                  <option value="medium">Aa Medium</option>
                  <option value="large">Aa Large</option>
                  <option value="xlarge">Aa X-Large</option>
                </select>
                
                {/* Wallpaper Selector */}
                <select 
                  className="text-xs border-none bg-gray-100 dark:bg-slate-700 rounded-lg p-1.5 outline-none cursor-pointer dark:text-white" 
                  value={chatTheme} 
                  onChange={e => setChatTheme(e.target.value)}
                >
                  <option value="romantic">🌸 Romantic</option>
                  <option value="ocean">🌊 Ocean</option>
                  <option value="sunset">🌅 Sunset</option>
                  <option value="forest">🌲 Forest</option>
                  <option value="galaxy">🌌 Galaxy</option>
                  <option value="midnight">🌙 Midnight</option>
                  <option value="lavender">💜 Lavender</option>
                  {customWallpaper && <option value="custom">🖼️ Custom</option>}
                </select>
                
                {/* Custom Wallpaper Upload */}
                <label className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition" title="Upload Custom Wallpaper">
                  🖼️
                  <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
                </label>
                
                {customWallpaper && (
                  <button onClick={clearCustomWallpaper} className="text-xs text-red-500 hover:text-red-700" title="Clear custom wallpaper">✕</button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-1 ${
                chatTheme === 'custom' && customWallpaper 
                  ? '' 
                  : wallpapers[chatTheme] || wallpapers.romantic
              }`}
              style={chatTheme === 'custom' && customWallpaper ? {
                backgroundImage: `url(${customWallpaper})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {selectedClub.messages?.map((msg, i) => {
                const firstUnreadIdx = getFirstUnreadIndex(selectedClub);
                const isFirstUnread = i === firstUnreadIdx && firstUnreadIdx > -1;
                return <MessageBubble key={msg._id || i} msg={msg} isFirstUnread={isFirstUnread} />;
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Always Visible at Bottom */}
            <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 relative">
              {/* Main Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 z-50">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border dark:border-slate-700">
                    <div className="flex justify-end p-1">
                      <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-red-500 p-1">×</button>
                    </div>
                    <EmojiPicker 
                      width={320} 
                      height={350} 
                      theme={theme}
                      onEmojiClick={(e) => setMessage(prev => prev + e.emoji)} 
                    />
                  </div>
                </div>
              )}

              {/* Reply Preview */}
              {replyingTo && (
                <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-2 rounded-lg mb-2 text-xs border-l-4 border-purple-400">
                  <div className="dark:text-gray-200">
                    <span className="font-bold text-purple-600 dark:text-purple-400">Replying to {replyingTo.username}</span>
                    <p className="text-gray-500 dark:text-gray-400 truncate">{replyingTo.content?.substring(0, 50)}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500 font-bold px-2">✕</button>
                </div>
              )}

              {/* Attachment Preview */}
              {attachment && (
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg mb-2">
                  <span className="text-2xl">📎</span>
                  <span className="text-sm text-purple-700 dark:text-purple-300 truncate flex-1">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-2xl hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition">
                  😊
                </button>
                <label className="p-3 text-gray-400 hover:text-purple-600 cursor-pointer transition text-xl">
                  📎 <input type="file" className="hidden" onChange={handleFileSelect} />
                </label>
                <textarea 
                  className={`flex-1 bg-gray-100 dark:bg-slate-700 border-none rounded-2xl p-3 outline-none resize-none ${fontSizes[fontSize]} max-h-32 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 dark:text-white dark:placeholder-gray-400 transition`}
                  placeholder={`Message #${selectedClub.name}`} 
                  rows="1"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                />
                <button 
                  type="submit" 
                  disabled={!message.trim() && !attachment}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:from-purple-600 hover:to-pink-600 transition w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xl">➤</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
            <span className="text-7xl mb-4 animate-bounce">💬</span>
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">Select a Community</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">Choose a club to start chatting</p>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: PROFILE */}
      {viewProfile && (
        <div className="w-80 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-6 flex flex-col shadow-2xl z-30 overflow-y-auto animate-slide-in-right">
          <div className="flex justify-between items-center mb-6">
            {!viewProfile.members && selectedClub ? (
              <button onClick={() => setViewProfile(selectedClub)} className="text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 font-bold text-xl h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition" title="Back to Club">←</button>
            ) : (
              <span /> 
            )}
            <button onClick={() => setViewProfile(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold text-xl">✕</button>
          </div>
          
          {viewProfile.members ? (
            /* Club Profile */
            <div className="text-center">
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-4xl mb-4 text-white font-bold overflow-hidden shadow-xl">
                {viewProfile.coverImage ? (
                  <img src={`http://localhost:5000${viewProfile.coverImage}`} className="w-full h-full object-cover" alt="" />
                ) : viewProfile.name[0]}
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{viewProfile.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{viewProfile.description}</p>
              
              {viewProfile.admins?.some(a => (a._id || a) === user._id) && (
                <button onClick={openEdit} className="mt-4 text-xs bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full font-bold transition">
                  ✏️ Edit Club
                </button>
              )}

              <div className="mt-8 text-left">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Members ({viewProfile.members?.length})</h4>
                <div className="space-y-2">
                  {viewProfile.members?.map(m => {
                    const color = getNameColor(m.name);
                    return (
                      <div key={m._id} onClick={() => setViewProfile(m)} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition">
                        <div className={`w-10 h-10 rounded-full overflow-hidden ${color.avatar} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                          {m.avatar ? <img src={`http://localhost:5000${m.avatar}`} className="w-full h-full object-cover" alt="" onError={e=>e.target.style.display='none'}/> : m.name[0]}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 dark:text-gray-200 block font-medium">{m.name}</span>
                          {viewProfile.admins.some(a => (a._id || a) === m._id) && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* User Profile */
            <div className="text-center">
              <div className="w-28 h-28 mx-auto bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full p-1 shadow-xl">
                <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full p-1 overflow-hidden flex items-center justify-center">
                  {viewProfile.avatar ? (
                    <img src={`http://localhost:5000${viewProfile.avatar}`} onError={(e) => e.target.style.display='none'} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">{viewProfile.name?.[0]}</span>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-4">{viewProfile.name}</h2>
              
              {/* Badges */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase border-b border-gray-100 dark:border-slate-700 pb-2 mb-3">Badges</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {viewProfile.badges?.map((b, i) => (
                    <div key={i} className="text-2xl p-2 bg-gray-50 dark:bg-slate-700 rounded-lg" title={b.name}>{b.icon || "🏅"}</div>
                  ))}
                  {!viewProfile.badges?.length && <p className="text-xs text-gray-400 dark:text-gray-500">No badges yet</p>}
                </div>
              </div>

              {/* Reading Stats */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase border-b border-gray-100 dark:border-slate-700 pb-2 mb-3">Reading Stats</h4>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                  <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">{viewProfile.shelf?.filter(b => b.status === 'completed').length || 0}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Books Completed</p>
                </div>
              </div>

              {/* Clubs they belong to */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase border-b border-gray-100 dark:border-slate-700 pb-2 mb-3">Member Of</h4>
                <div className="space-y-2">
                  {clubs.filter(c => c.members.some(m => (m._id || m) === viewProfile._id)).map(club => (
                    <div 
                      key={club._id} 
                      onClick={() => { setSelectedClub(club); setViewProfile(club); }}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                        {club.coverImage ? (
                          <img src={`http://localhost:5000${club.coverImage}`} className="w-full h-full object-cover" alt="" />
                        ) : club.name[0]}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{club.name}</span>
                    </div>
                  ))}
                  {clubs.filter(c => c.members.some(m => (m._id || m) === viewProfile._id)).length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Not in any clubs</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal (Create/Edit Club) */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <h2 className="text-2xl font-serif font-bold mb-4 text-slate-800 dark:text-white">{showEditModal ? "Edit Club" : "New Club"}</h2>
            <form onSubmit={handleSubmitClub}>
              <div className="mb-4 text-center">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Club Profile Picture</label>
                <input 
                  type="file" 
                  onChange={e => setClubForm({...clubForm, coverImageFile: e.target.files[0]})} 
                  className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 dark:file:bg-purple-900/50 file:text-purple-700 dark:file:text-purple-400 hover:file:bg-purple-100 dark:hover:file:bg-purple-900"
                />
              </div>
              <input 
                className="w-full bg-gray-50 dark:bg-slate-700 p-3 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Club Name" 
                value={clubForm.name} 
                onChange={e => setClubForm({...clubForm, name: e.target.value})} 
                required 
              />
              <textarea 
                className="w-full bg-gray-50 dark:bg-slate-700 p-3 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Description" 
                value={clubForm.description} 
                onChange={e => setClubForm({...clubForm, description: e.target.value})} 
                required 
              />
              <input 
                className="w-full bg-gray-50 dark:bg-slate-700 p-3 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 dark:text-white dark:placeholder-gray-400" 
                placeholder="Current Book (Optional)" 
                value={clubForm.currentBook} 
                onChange={e => setClubForm({...clubForm, currentBook: e.target.value})} 
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition" 
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition"
                >
                  {showEditModal ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
