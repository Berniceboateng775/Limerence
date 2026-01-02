import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { toast } from "../components/Toast";
import EmojiPicker from "emoji-picker-react";

export default function Clubs() {
  const { token, user } = useContext(AuthContext);
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
  const [reactionTarget, setReactionTarget] = useState(null); // Message ID for reaction picker
  const [searchQuery, setSearchQuery] = useState("");
  const [chatTheme, setChatTheme] = useState(localStorage.getItem("chatTheme") || "default");
  
  const messagesEndRef = useRef(null);

  // Themes
  const themes = {
      default: "bg-slate-50",
      dark: "bg-slate-900 text-gray-100",
      starry: "bg-indigo-950 text-white",
      sunset: "bg-orange-50",
      forest: "bg-green-50"
  };

  const fetchClubs = React.useCallback(async () => {
    try {
      const res = await axios.get("/api/clubs");
      setClubs(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchClubs();
    const interval = setInterval(fetchClubs, 5000); 
    return () => clearInterval(interval);
  }, [fetchClubs, token]);

  const markAsRead = async (clubId) => {
      try { await axios.post(`/api/clubs/${clubId}/read`, {}, { headers: { "x-auth-token": token } }); } 
      catch (e) { console.error(e); }
  };

  const calculateUnread = (club) => {
      const stats = club.memberStats?.find(s => s.user === user._id || s.user._id === user._id);
      const lastRead = stats ? new Date(stats.lastReadAt).getTime() : 0;
      return club.messages.filter(m => {
          const isMe = (m.user._id || m.user) === user._id;
          return !isMe && new Date(m.createdAt).getTime() > lastRead;
      }).length;
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
      setShowEmojiPicker(false);
      markAsRead(selectedClub._id); // Mark as read immediately
      fetchClubs(); 
    } catch (err) { console.error(err); toast("Failed to send", "error"); }
  };

  // Generic Create/Update Handler
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
              // Update
              await axios.put(`/api/clubs/${selectedClub._id}`, formData, { 
                  headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" } 
              });
              toast("Club updated!", "success");
              setShowEditModal(false);
          } else {
              // Create
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
      try {
          await axios.post(`/api/clubs/${selectedClub._id}/messages/${msgId}/react`, { emoji }, {
              headers: { "x-auth-token": token }
          });
          fetchClubs();
      } catch (e) { console.error(e); }
  };

  const handleJoin = async (id) => {
    try {
      await axios.post(`/api/clubs/${id}/join`, {}, { headers: { "x-auth-token": token } });
      fetchClubs();
      toast("Joined!", "success");
    } catch (err) { toast("Failed", "error"); }
  };

  const handleFileSelect = (e) => { if (e.target.files[0]) setAttachment(e.target.files[0]); };

  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- UI COMPONENTS ---

  const MessageBubble = ({ msg }) => {
      const isMe = msg.user === user._id || msg.user?._id === user._id;
      return (
          <div className={`flex flex-col mb-4 bg-transparent group ${isMe ? "items-end" : "items-start"} relative z-0`}>
               {msg.replyTo && (
                   <div className={`text-xs mb-1 p-2 rounded-lg opacity-70 border-l-2 max-w-[70%] ${isMe ? "bg-purple-100 border-purple-400 text-purple-800" : "bg-gray-200 border-gray-400 text-gray-600"}`}>
                       <span className="font-bold">{msg.replyTo.username}</span>: {msg.replyTo.content?.substring(0, 30)}...
                   </div>
               )}

               <div className="flex gap-2 max-w-[70%]">
                   {!isMe && (
                       <div onClick={() => setViewProfile(msg.user)} className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 cursor-pointer overflow-hidden shadow-sm flex items-center justify-center text-xs font-bold text-gray-500">
                           {msg.user?.avatar ? (
                               <img src={`http://localhost:5000${msg.user.avatar}`} onError={(e) => e.target.style.display='none'} className="w-full h-full object-cover" alt="av" />
                           ) : (
                               (msg.username?.[0] || "?")
                           )}
                       </div>
                   )}
                   
                   <div className="relative">
                        <div className={`p-3 rounded-2xl shadow-sm relative text-[15px] leading-relaxed break-words ${
                            isMe 
                            ? "bg-purple-600 text-white rounded-tr-none" 
                            : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                        }`}>
                            {!isMe && <span className="block text-[10px] font-bold text-purple-600/70 mb-1 cursor-pointer" onClick={() => setViewProfile(msg.user)}>{msg.username}</span>}
                            
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

                        {msg.reactions?.length > 0 && (
                            <div className={`absolute -bottom-3 ${isMe ? "right-0" : "left-0"} flex gap-1 bg-white/90 shadow rounded-full px-1.5 py-0.5 border border-gray-100 z-10`}>
                                {msg.reactions.map((r, i) => <span key={i} className="text-xs">{r.emoji}</span>)}
                            </div>
                        )}

                        <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-28" : "-right-28"} opacity-0 group-hover:opacity-100 transition flex gap-1 bg-white/80 p-1 rounded-full shadow-sm z-10`}>
                            <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-purple-100 rounded-full text-xs" title="Reply">↩️</button>
                            <button onClick={() => handleReaction(msg._id, "❤️")} className="p-1 hover:bg-red-100 rounded-full text-xs">❤️</button>
                            <button onClick={() => handleReaction(msg._id, "😂")} className="p-1 hover:bg-yellow-100 rounded-full text-xs">😂</button>
                            <button onClick={() => setReactionTarget(reactionTarget === msg._id ? null : msg._id)} className="p-1 hover:bg-gray-200 rounded-full text-xs">➕</button>
                        </div>
                        
                        {/* Reaction Picker - Side Positioned */}
                        {reactionTarget === msg._id && (
                            <div className={`absolute bottom-0 z-50 shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/5 bg-white ${isMe ? "right-full mr-2" : "left-full ml-2"}`}>
                                 <button onClick={() => setReactionTarget(null)} className="absolute top-1 right-1 z-50 text-gray-400 hover:text-red-500 font-bold px-2 bg-white/80 rounded-full">×</button>
                                 <EmojiPicker 
                                    width={280} 
                                    height={300} 
                                    previewConfig={{ showPreview: false }}
                                    searchDisabled={true}
                                    onEmojiClick={(e) => { handleReaction(msg._id, e.emoji); setReactionTarget(null); }} 
                                 />
                            </div>
                        )}
                   </div>
               </div>
          </div>
      )
  };



  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden font-sans pt-0">
        
        {/* LEFT SIDEBAR: LIST */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col z-20 shadow-xl">
            <div className="p-6 border-b border-gray-50 bg-white sticky top-0">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif font-bold text-slate-800">Community</h2>
                    <button onClick={() => { setClubForm({name:"",desc:"",currentBook:""}); setShowCreateModal(true); }} className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center font-bold text-xl transition">+</button>
                </div>
                {/* Search Bar - Moved Here */}
                <input 
                    type="text" 
                    placeholder="Search clubs..." 
                    className="w-full bg-gray-100 border-none p-2 px-4 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredClubs.map(club => {
                    const unread = calculateUnread(club);
                    const isMember = club.members.some(m => (m._id || m) === user._id);
                    return (
                        <div key={club._id} onClick={() => isMember ? setSelectedClub(club) : handleJoin(club._id)}
                            className={`p-3 rounded-xl cursor-pointer transition flex items-center gap-3 group relative ${selectedClub?._id === club._id ? "bg-purple-50 ring-1 ring-purple-100" : "hover:bg-gray-50"}`}>
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                {/* Use coverImage if available, else letter */}
                                {club.coverImage ? (
                                    <img src={club.coverImage} className="w-full h-full object-cover" alt="club" /> 
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500 bg-gradient-to-br from-slate-100 to-slate-200">{club.name[0]}</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">{club.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{club.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {!isMember && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Join</span>}
                                {unread > 0 && isMember && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">{unread}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* CENTER: CHAT */}
        <div className={`flex-1 flex flex-col relative transition-colors duration-500 ${themes[chatTheme]}`}>
            {selectedClub ? (
                <>
                    {/* Header */}
                    <div className="p-4 bg-white/90 backdrop-blur border-b border-gray-100 flex justify-between items-center shadow-sm z-10 text-gray-800">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewProfile(selectedClub)}>
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">{selectedClub.name[0]}</div>
                            <div>
                                <h3 className="font-bold">{selectedClub.name}</h3>
                                <p className="text-xs opacity-70">{selectedClub.members.length} members</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                             {/* Theme Selector */}
                             <select className="text-xs border-none bg-gray-100 rounded-lg p-1 outline-none cursor-pointer" value={chatTheme} onChange={e => setChatTheme(e.target.value)}>
                                 <option value="default">Light</option>
                                 <option value="dark">Dark</option>
                                 <option value="starry">Starry</option>
                                 <option value="sunset">Sunset</option>
                                 <option value="forest">Forest</option>
                             </select>
                            <button onClick={() => setSelectedClub(null)} className="md:hidden text-gray-500">Back</button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
                        {selectedClub.messages?.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100 relative">
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-20 left-4 z-50">
                                <EmojiPicker onEmojiClick={(e) => { setMessage(prev => prev + e.emoji); }} />
                            </div>
                        )}

                        {replyingTo && (
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-2 text-xs border-l-4 border-purple-400">
                                <div><span className="font-bold text-purple-600">Replying to {replyingTo.username}</span></div>
                                <button onClick={() => setReplyingTo(null)} className="text-gray-400 font-bold px-2">✕</button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-2 items-end text-gray-800">
                            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-2xl hover:bg-gray-100 rounded-full transition">😊</button>
                            <label className="p-3 text-gray-400 hover:text-purple-600 cursor-pointer transition">
                                📎 <input type="file" className="hidden" onChange={handleFileSelect} />
                            </label>
                            <textarea 
                                className="flex-1 bg-gray-100 border-none rounded-2xl p-3 outline-none resize-none text-sm max-h-32 focus:ring-2 focus:ring-purple-100"
                                placeholder={`Message #${selectedClub.name}`} 
                                rows="1"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                            />
                            <button type="submit" className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition w-10 h-10 flex items-center justify-center">➤</button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                    <span className="text-6xl mb-4">💬</span>
                </div>
            )}
        </div>

        {/* RIGHT SIDEBAR: PROFILE */}
        {viewProfile && (
            <div className="w-72 bg-white border-l border-gray-100 p-6 flex flex-col animate-slide-in-right shadow-2xl z-30 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    {/* Back Button logic: If viewing a user (no members array) and inside a club, show back */}
                    {(!viewProfile.members && selectedClub) ? (
                         <button onClick={() => setViewProfile(selectedClub)} className="text-gray-500 hover:text-purple-600 font-bold text-xl h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition" title="Back to Club">←</button>
                    ) : (
                         <span /> 
                    )}
                    <button onClick={() => setViewProfile(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                </div>
                
                {viewProfile.members ? ( // Club Profile
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-slate-100 rounded-3xl flex items-center justify-center text-4xl mb-4 text-purple-600 font-bold overflow-hidden">
                             {viewProfile.coverImage ? (
                                 <img src={`http://localhost:5000${viewProfile.coverImage}`} className="w-full h-full object-cover" alt="cover" />
                             ) : viewProfile.name[0]}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{viewProfile.name}</h2>
                        <p className="text-sm text-gray-500 mt-2">{viewProfile.description}</p>
                        
                        {viewProfile.admins?.some(a => (a._id || a) === user._id) && (
                            <button onClick={openEdit} className="mt-4 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full font-bold">Edit Club</button>
                        )}

                        <div className="mt-8 text-left">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Members</h4>
                            <div className="space-y-2">
                                {viewProfile.members?.map(m => (
                                    <div key={m._id} onClick={() => setViewProfile(m)} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {m.avatar ? <img src={`http://localhost:5000${m.avatar}`} className="w-full h-full object-cover" alt="av" onError={e=>e.target.style.display='none'}/> : m.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm text-gray-700 block font-medium">{m.name}</span>
                                            {viewProfile.admins.some(a => (a._id || a) === m._id) && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded">ADMIN</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // User Profile
                    <div className="text-center">
                         <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full p-1 shadow-lg">
                           <div className="w-full h-full bg-white rounded-full p-1 overflow-hidden flex items-center justify-center bg-slate-100">
                               {viewProfile.avatar ? (
                                   <img src={`http://localhost:5000${viewProfile.avatar}`} onError={(e) => e.target.style.display='none'} alt="av" className="w-full h-full object-cover" />
                               ) : (
                                   <span className="text-4xl font-bold text-slate-300">{viewProfile.name[0]}</span>
                               )}
                           </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mt-4">{viewProfile.name}</h2>
                        
                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-2">Badges</h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {viewProfile.badges?.map((b, i) => <div key={i} className="text-2xl" title={b.name}>{b.icon || "🏅"}</div>)}
                                {!viewProfile.badges?.length && <p className="text-xs text-gray-400">No badges.</p>}
                            </div>
                        </div>

                         <div className="mt-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-2">Reading Stats</h4>
                            <p className="text-sm text-gray-600">Books Read: <b className="text-purple-600 text-lg">{viewProfile.shelf?.filter(b => b.status === 'completed').length || 0}</b></p>
                         </div>
                    </div>
                )}
            </div>
        )}

        {/* Modal (Create/Edit) */}
        {(showCreateModal || showEditModal) && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
                     <h2 className="text-2xl font-serif font-bold mb-4">{showEditModal ? "Edit Club" : "New Club"}</h2>
                     <form onSubmit={handleSubmitClub}>
                         <div className="mb-4 text-center">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Club Profile Picture</label>
                            <input type="file" onChange={e => setClubForm({...clubForm, coverImageFile: e.target.files[0]})} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                         </div>
                         <input className="w-full bg-gray-50 p-3 rounded-xl mb-3 outline-none" placeholder="Club Name" value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})} required />
                         <textarea className="w-full bg-gray-50 p-3 rounded-xl mb-3 outline-none" placeholder="Description" value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})} required />
                         <input className="w-full bg-gray-50 p-3 rounded-xl mb-3 outline-none" placeholder="Current Book (Optional)" value={clubForm.currentBook} onChange={e => setClubForm({...clubForm, currentBook: e.target.value})} />
                         <div className="flex gap-2">
                             <button type="button" className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>Cancel</button>
                             <button type="submit" className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700">{showEditModal ? "Save" : "Create"}</button>
                         </div>
                     </form>
                 </div>
            </div>
        )}
    </div>
  );
}
