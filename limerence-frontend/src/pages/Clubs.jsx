import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { toast } from "../components/Toast";

export default function Clubs() {
  const { token, user } = useContext(AuthContext);
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [viewProfile, setViewProfile] = useState(null); // User profile to show in right sidebar
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: "", description: "", currentBook: "" });

  // Chat State
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // Message object being replied to
  const messagesEndRef = useRef(null);

  // Poll for updates (Simulation for real-time)
  useEffect(() => {
    fetchClubs();
    const interval = setInterval(fetchClubs, 5000); // 5s polling
    return () => clearInterval(interval);
  }, [token]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Mark as read when opening/updating club
    if (selectedClub) {
        markAsRead(selectedClub._id);
    }
  }, [selectedClub?.messages?.length, selectedClub?._id]);

  const fetchClubs = async () => {
    try {
      const res = await axios.get("/api/clubs");
      setClubs(res.data);
      // Update selected club data if open to show new messages
      if (selectedClub) {
          const updated = res.data.find(c => c._id === selectedClub._id);
          if (updated) setSelectedClub(updated);
      }
    } catch (err) { console.error(err); }
  };

  const markAsRead = async (clubId) => {
      try {
          await axios.post(`/api/clubs/${clubId}/read`, {}, { headers: { "x-auth-token": token } });
      } catch (e) { console.error(e); }
  };

  const calculateUnread = (club) => {
      const stats = club.memberStats?.find(s => s.user === user._id || s.user._id === user._id);
      const lastRead = stats ? new Date(stats.lastReadAt).getTime() : 0;
      return club.messages.filter(m => new Date(m.createdAt).getTime() > lastRead).length;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !attachment) return;

    try {
      const formData = new FormData();
      formData.append("content", message);
      formData.append("username", user.name);
      if (attachment) formData.append("attachment", attachment);
      if (replyingTo) formData.append("replyTo", JSON.stringify(replyingTo));

      await axios.post(`/api/clubs/${selectedClub._id}/message`, formData, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
      });
      
      setMessage("");
      setAttachment(null);
      setReplyingTo(null);
      fetchClubs(); // Instant refresh
    } catch (err) { console.error(err); }
  };

  const handleReaction = async (msgId, emoji) => {
      try {
          await axios.post(`/api/clubs/${selectedClub._id}/messages/${msgId}/react`, { emoji }, {
              headers: { "x-auth-token": token }
          });
          fetchClubs();
      } catch (e) { console.error(e); }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/clubs", { ...newClub, currentBook: { title: newClub.currentBook } }, {
        headers: { "x-auth-token": token },
      });
      setShowCreateModal(false);
      setNewClub({ name: "", description: "", currentBook: "" });
      fetchClubs();
      toast("Club created!", "success");
    } catch (err) { toast("Failed to create", "error"); }
  };

    const handleJoin = async (id) => {
    try {
      await axios.post(`/api/clubs/${id}/join`, {}, { headers: { "x-auth-token": token } });
      fetchClubs();
      toast("Joined!", "success");
    } catch (err) { toast("Failed", "error"); }
  };

  const handleFileSelect = (e) => { if (e.target.files[0]) setAttachment(e.target.files[0]); };

  // --- UI COMPONENTS ---

  const MessageBubble = ({ msg }) => {
      const isMe = msg.user === user._id || msg.user?._id === user._id;
      const reactions = msg.reactions || [];
      
      return (
          <div className={`flex flex-col mb-4 bg-transparent group ${isMe ? "items-end" : "items-start"}`}>
               {/* Reply Context */}
               {msg.replyTo && (
                   <div className={`text-xs mb-1 p-2 rounded-lg opacity-70 border-l-2 ${isMe ? "bg-purple-100 border-purple-400 text-purple-800" : "bg-gray-100 border-gray-400 text-gray-600"}`}>
                       <span className="font-bold">{msg.replyTo.username}</span>: {msg.replyTo.content.substring(0, 30)}...
                   </div>
               )}

               <div className="flex gap-2 max-w-[70%]">
                   {!isMe && (
                       <div 
                        onClick={() => setViewProfile(msg.user)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex-shrink-0 cursor-pointer hover:ring-2 ring-purple-400 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                       >
                           {msg.username?.[0] || "?"}
                       </div>
                   )}
                   
                   <div className="relative">
                        <div className={`p-3 rounded-2xl shadow-sm relative text-[15px] leading-relaxed ${
                            isMe 
                            ? "bg-purple-600 text-white rounded-tr-none" 
                            : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                        }`}>
                            {msg.username && !isMe && <span className="block text-[10px] font-bold text-purple-600/70 mb-1 cursor-pointer" onClick={() => setViewProfile(msg.user)}>{msg.username}</span>}
                            
                            {/* Attachment */}
                            {msg.attachment && (
                                <div className="mb-2">
                                    {msg.attachment.fileType === 'image' ? (
                                        <img src={`http://localhost:5000${msg.attachment.url}`} className="rounded-lg max-h-48 object-cover" alt="att" />
                                    ) : (
                                        <div className="bg-black/10 p-2 rounded flex items-center gap-2">📄 {msg.attachment.name}</div>
                                    )}
                                </div>
                            )}

                            {msg.content}
                            
                            <span className={`text-[9px] opacity-60 block mt-1 text-right ${isMe ? "text-purple-200" : "text-gray-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>

                        {/* Reactions Display */}
                        {reactions.length > 0 && (
                            <div className={`absolute -bottom-3 ${isMe ? "right-0" : "left-0"} flex gap-1 bg-white/90 shadow rounded-full px-1.5 py-0.5 border border-gray-100`}>
                                {reactions.map((r, i) => <span key={i} className="text-xs">{r.emoji}</span>)}
                            </div>
                        )}

                        {/* Actions (Hover) */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-20" : "-right-20"} opacity-0 group-hover:opacity-100 transition flex gap-1`}>
                            <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-gray-100 rounded-full hover:bg-purple-100 text-xs shadow-sm">↩️</button>
                            <button onClick={() => handleReaction(msg._id, "❤️")} className="p-1.5 bg-gray-100 rounded-full hover:bg-red-100 text-xs shadow-sm">❤️</button>
                            <button onClick={() => handleReaction(msg._id, "😂")} className="p-1.5 bg-gray-100 rounded-full hover:bg-yellow-100 text-xs shadow-sm">😂</button>
                            <button onClick={() => handleReaction(msg._id, "👍")} className="p-1.5 bg-gray-100 rounded-full hover:bg-blue-100 text-xs shadow-sm">👍</button>
                        </div>
                   </div>
               </div>
          </div>
      )
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden font-sans pt-0">
        
        {/* LEFT SIDEBAR: CLUBS LIST */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col z-20 shadow-xl">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0">
                <h2 className="text-2xl font-serif font-bold text-slate-800">Community</h2>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center font-bold text-xl transition"
                >
                    +
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {clubs.map(club => {
                    const unread = calculateUnread(club);
                    const isMember = club.members.some(m => (m._id || m) === user._id);
                    
                    return (
                        <div 
                            key={club._id}
                            onClick={() => isMember ? setSelectedClub(club) : handleJoin(club._id)}
                            className={`p-3 rounded-xl cursor-pointer transition flex items-center gap-3 relative group ${selectedClub?._id === club._id ? "bg-purple-50 ring-1 ring-purple-100" : "hover:bg-gray-50"}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg font-bold text-gray-500 flex-shrink-0">
                                {club.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">{club.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{club.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {!isMember && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Join</span>}
                                {unread > 0 && isMember && (
                                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
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
        <div className="flex-1 flex flex-col bg-slate-50/50 relative">
            {selectedClub ? (
                <>
                    {/* Header */}
                    <div className="p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center gap-3" onClick={() => setViewProfile(selectedClub)}>
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                {selectedClub.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 cursor-pointer hover:underline">{selectedClub.name}</h3>
                                <p className="text-xs text-gray-500">{selectedClub.members.length} members • {selectedClub.currentBook?.title || "No current book"}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedClub(null)} className="md:hidden text-gray-500">Back</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
                        {selectedClub.messages?.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        {replyingTo && (
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-2 text-xs border-l-4 border-purple-400">
                                <div>
                                    <span className="font-bold text-purple-600">Replying to {replyingTo.username}</span>
                                    <p className="opacity-70 truncate">{replyingTo.content}</p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500 font-bold px-2">✕</button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                            <label className="p-3 text-gray-400 hover:text-purple-600 cursor-pointer transition">
                                📎 <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                            </label>
                            <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-purple-100 transition">
                                <textarea 
                                    className="bg-transparent border-none w-full outline-none resize-none text-sm max-h-32"
                                    placeholder={`Message #${selectedClub.name}`} 
                                    rows="1"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                                    }}
                                />
                            </div>
                            <button type="submit" className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition w-10 h-10 flex items-center justify-center transform hover:scale-105 active:scale-95">
                                ➤
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                    <span className="text-6xl mb-4">💬</span>
                    <p className="font-medium">Select a club to start chatting</p>
                </div>
            )}
        </div>

        {/* RIGHT SIDEBAR: PROFILE / INFO */}
        {viewProfile && (
            <div className="w-72 bg-white border-l border-gray-100 p-6 flex flex-col animate-slide-in-right shadow-2xl z-30 overflow-y-auto">
                <button onClick={() => setViewProfile(null)} className="self-end text-gray-400 hover:text-gray-600 mb-4">✕</button>
                
                {/* Check if viewing Club or User */}
                {viewProfile.name && !viewProfile.email ? (
                    // Club Details
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-purple-100 rounded-3xl flex items-center justify-center text-4xl mb-4 text-purple-600 font-bold shadow-inner">
                            {viewProfile.name[0]}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{viewProfile.name}</h2>
                        <p className="text-sm text-gray-500 mt-2">{viewProfile.description}</p>
                        
                        <div className="mt-8 text-left">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Members ({viewProfile.members?.length || 0})</h4>
                            <div className="space-y-2">
                                {viewProfile.members?.map(m => (
                                    <div key={m._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                                        <span className="text-sm text-gray-700">{m.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // User Profile (Mocked data usage as user obj is generic)
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full p-1 shadow-lg">
                           <div className="w-full h-full bg-white rounded-full p-1">
                               <img src={`http://localhost:5000${viewProfile.avatar}`} onError={(e) => e.target.src="https://via.placeholder.com/150"} alt="av" className="w-full h-full rounded-full object-cover" />
                           </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mt-4">{viewProfile.name}</h2>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Online</span>

                        <div className="mt-8">
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Badges</h4>
                             <div className="flex flex-wrap justify-center gap-2">
                                 {viewProfile.badges?.map((b, i) => (
                                     <div key={i} className="text-2xl" title={b.name}>{b.icon || "🏅"}</div>
                                 ))}
                                 {!viewProfile.badges?.length && <p className="text-xs text-gray-400">No badges yet.</p>}
                             </div>
                        </div>

                        <button className="mt-8 w-full py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition">
                            Send Friend Request
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
                     <h2 className="text-2xl font-serif font-bold mb-4">New Club</h2>
                     <input className="w-full bg-gray-50 p-3 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-purple-200" placeholder="Club Name" value={newClub.name} onChange={e => setNewClub({...newClub, name: e.target.value})} />
                     <textarea className="w-full bg-gray-50 p-3 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-purple-200" placeholder="Description" value={newClub.description} onChange={e => setNewClub({...newClub, description: e.target.value})} />
                     <div className="flex gap-2">
                         <button className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl" onClick={() => setShowCreateModal(false)}>Cancel</button>
                         <button className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700" onClick={handleCreateClub}>Create</button>
                     </div>
                 </div>
            </div>
        )}

    </div>
  );
}
