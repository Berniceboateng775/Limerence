import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "../components/Toast";

export default function Clubs({ setHideNavbar }) { // Accepted prop if we need to hide nav in chat (optional)
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: "", description: "", currentBook: "" });
  const [message, setMessage] = useState("");
  const { token, user } = useContext(AuthContext);
  const [attachment, setAttachment] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [showStickers, setShowStickers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  // Massive Sticker Library
  const stickerCategories = {
    "Faces": ["😀", "😂", "😍", "😭", "😡", "😱", "🥳", "🥺", "🙄", "🤠", "😎", "🤔"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💗", "💓"],
    "Hands": ["👍", "👎", "👏", "🙌", "👐", "🤝", "✌️", "🤟", "🤘", "🤙", "👈", "👉"],
    "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮"],
    "Food": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒"],
    "Objects": ["📚", "📖", "📔", "📒", "📕", "📗", "📘", "📙", "📜", "📃", "📄", "📑"],
    "Flags": ["🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🏳️‍⚧️", "🇺🇳", "🇦🇫", "🇦🇽", "🇦🇱", "🇩🇿", "🇦🇸"]
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedClub?.messages]);

  const fetchClubs = async () => {
    try {
      const res = await axios.get("/api/clubs");
      setClubs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClubs = clubs.filter(c => 
     c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newClub,
        currentBook: { title: newClub.currentBook } 
      };
      await axios.post("/api/clubs", payload, {
        headers: { "x-auth-token": token },
      });
      setShowCreateModal(false);
      fetchClubs();
      setNewClub({ name: "", description: "", currentBook: "" });
      toast("Club created successfully!", "success");
    } catch (err) {
      toast("Failed to create club", "error");
    }
  };

  const handleJoin = async (id) => {
    try {
      await axios.post(`/api/clubs/${id}/join`, {}, {
        headers: { "x-auth-token": token },
      });
      fetchClubs();
      toast("Joined club!", "success");
    } catch (err) {
      toast(err.response?.data?.msg || "Failed to join", "error");
    }
  };

  const handleLeave = async (id) => {
      if(!window.confirm("Are you sure you want to leave this club?")) return;
      try {
          await axios.post(`/api/clubs/${id}/leave`, {}, {
              headers: { "x-auth-token": token }
          });
          setSelectedClub(null); 
          fetchClubs(); 
          toast("Left club.", "success");
      } catch (err) {
          toast("Failed to leave.", "error");
      }
  };

  const handleKickMember = async (userId) => {
      if (!window.confirm("Kick this member?")) return;
      try {
          await axios.post(`/api/clubs/${selectedClub._id}/kick`, { userIdToKick: userId }, {
              headers: { "x-auth-token": token }
          });
          // Optimistic update
          const updatedClub = { ...selectedClub };
          updatedClub.members = updatedClub.members.filter(m => (m._id || m) !== userId);
          setSelectedClub(updatedClub);
          toast("Member kicked.", "success");
      } catch (err) {
          toast("Failed to kick member.", "error");
      }
  };

  // Local state to track sent requests in this session to update UI instantly
  const [sentRequests, setSentRequests] = useState(new Set());

  const handleAddFriend = async (userId) => {
      try {
          await axios.post(`/api/users/friend-request/${userId}`, {}, {
              headers: { "x-auth-token": token }
          });
          setSentRequests(prev => new Set(prev).add(userId)); // Update local state
          toast("Friend request sent!", "success");
      } catch (err) {
          toast(err.response?.data?.msg || "Failed", "error");
      }
  };

  const handleSendSticker = async (sticker) => {
    try {
        const formData = new FormData();
        formData.append("username", user.name);
        formData.append("content", "Sent a sticker"); // Text fallback
        formData.append("attachment", JSON.stringify({
            fileType: "sticker",
            url: sticker, 
            name: "Sticker"
        }));

        const res = await axios.post(`/api/clubs/${selectedClub._id}/message`, formData, {
            headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
        });
        
        setSelectedClub(prev => ({ ...prev, messages: res.data }));
        setShowStickers(false);
    } catch (err) {
        console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !attachment) return;

    try {
      const formData = new FormData();
      formData.append("content", message);
      formData.append("username", user.name);
      if (attachment) formData.append("attachment", attachment);

      const res = await axios.post(`/api/clubs/${selectedClub._id}/message`, formData, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
      });

      setSelectedClub(prev => ({ ...prev, messages: res.data }));
      setMessage("");
      setAttachment(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ... Recorder logic (Start/Stop) same as before ...
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) setAudioChunks((prev) => [...prev, e.data]); };
      recorder.start();
      setIsRecording(true);
    } catch (err) { alert("Could not access microphone"); }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "voice_note.webm", { type: "audio/webm" });
        setAttachment(audioFile);
        setAudioChunks([]);
        setIsRecording(false);
      };
    }
  };
  
  const handleFileSelect = (e) => { if (e.target.files[0]) setAttachment(e.target.files[0]); };
  const [showInfo, setShowInfo] = useState(false);


  // CHAT SCREEN
  if (selectedClub) {
    const isAdmin = selectedClub.admins?.some(a => (a._id || a) === user?._id);

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans">
        {/* Chat Header - Matches Dream Theme */}
        <div className="bg-dream-gradient text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedClub(null)} className="hover:bg-white/20 p-2 rounded-full transition">
              <span className="text-xl">←</span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold text-lg border-2 border-white/50">
                    {selectedClub.name[0]}
                </div>
                <div>
                    <h2 className="font-bold text-lg leading-tight">{selectedClub.name}</h2>
                    <p className="text-xs text-white/80 truncate max-w-[200px]">
                        {selectedClub.members.length} members • {selectedClub.currentBook?.title || "No book"}
                    </p>
                </div>
            </div>
          </div>
          <button onClick={() => setShowInfo(!showInfo)} className="text-white hover:bg-white/20 p-2 rounded-full transition">
            ℹ️
          </button>
        </div>

        {/* Info Sidebar */}
        {showInfo && (
            <div className="absolute inset-0 z-50 bg-black/50 flex justify-end" onClick={() => setShowInfo(false)}>
                <div className="w-80 bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 font-serif">Club Info</h3>
                    <p className="text-gray-600 mb-6 text-sm italic">{selectedClub.description}</p>
                    
                    <h4 className="font-bold text-xs text-slate-400 uppercase mb-3 tracking-wider">Members</h4>
                    <div className="space-y-4">
                        {selectedClub.members.map(member => (
                            <div key={member._id || member} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {(member.name || "?")[0]}
                                    </div>
                                    <span className="text-sm font-medium text-gray-800">
                                        {(member.nickname || member.name || "Unknown")}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {member._id !== user._id && (
                                        sentRequests.has(member._id) ? (
                                            <span className="w-8 h-8 flex items-center justify-center text-green-500 font-bold" title="Request Sent">✓</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleAddFriend(member._id)}
                                                className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition"
                                                title="Add Friend"
                                            >
                                                +
                                            </button>
                                        )
                                    )}
                                    {isAdmin && member._id !== user._id && (
                                        <button 
                                            onClick={() => handleKickMember(member._id)}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Kick
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t space-y-3">
                         <button 
                            onClick={() => handleLeave(selectedClub._id)}
                            className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition"
                         >
                             Leave Club
                         </button>
                    </div>
                </div>
            </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 pb-24" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
          {selectedClub.messages?.map((msg, idx) => {
              const isMe = msg.user === user?._id;
              const isSticker = msg.attachment?.fileType === 'sticker';
              return (
              <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}>
                {!isMe && <span className="text-[10px] text-slate-400 mb-1 px-1 ml-1">{msg.username}</span>}
                <div className={`max-w-[80%] rounded-2xl relative shadow-sm ${
                  isMe 
                    ? "bg-purple-600 text-white rounded-tr-sm" 
                    : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                } ${isSticker ? "bg-transparent border-none shadow-none text-6xl" : "p-3"}`}>
                   
                   {msg.attachment && (
                       <div className="mb-2">
                           {msg.attachment.fileType === 'image' ? (
                               <img src={`http://localhost:5000${msg.attachment.url}`} alt="attachment" className="rounded-lg max-h-64 object-cover border-2 border-white/20" />
                           ) : isSticker ? (
                               <div className="hover:scale-110 transition cursor-pointer">{msg.attachment.url}</div>
                           ) : msg.attachment.fileType === 'audio' ? (
                               <div className="flex items-center gap-2 bg-black/10 p-2 rounded-full min-w-[200px]">
                                   <span>🎤</span>
                                   <audio controls src={`http://localhost:5000${msg.attachment.url}`} className="h-6 w-32" />
                               </div>
                           ) : (
                               <a href={`http://localhost:5000${msg.attachment.url}`} target="_blank" className="flex items-center gap-2 bg-black/5 p-2 rounded-lg">
                                   📄 <span className="underline text-xs">{msg.attachment.name}</span>
                               </a>
                           )}
                       </div>
                   )}
                   {(!isSticker) && <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{msg.content}</p>}
                   <span className={`text-[9px] opacity-60 block text-right mt-1 ${isMe ? "text-purple-100" : "text-gray-400"}`}>
                       {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                </div>
              </div>
            )})}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-3 border-t flex flex-col gap-2">
          {attachment && (
              <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-lg text-xs text-purple-700 w-fit">
                  <span>📎 {attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="font-bold text-red-500">✕</button>
              </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <label className="cursor-pointer text-gray-400 hover:text-purple-600 p-2 transition">
                <span className="text-xl">📷</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
            
            <button 
                type="button"
                onClick={() => setShowStickers(!showStickers)}
                className="text-gray-400 hover:text-yellow-500 p-2 text-xl transition"
            >
                😊
            </button>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-gray-100 border-none p-3 rounded-full focus:ring-2 focus:ring-purple-300 outline-none text-sm transition"
            />
            
            <button 
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition ${isRecording ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-gray-600"}`}
            >
                <span className="text-xl">🎤</span>
            </button>

            <button 
              type="submit"
              className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition w-10 h-10 flex items-center justify-center shadow-lg shadow-purple-200"
            >
              ➤
            </button>
          </form>

          {/* Sticker Drawer */}
          {showStickers && (
             <div className="h-48 overflow-y-auto border-t pt-2 grid gap-4 bg-gray-50 p-2 rounded-lg scrollbar-hide">
                 {Object.entries(stickerCategories).map(([category, stickers]) => (
                     <div key={category}>
                         <h5 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{category}</h5>
                         <div className="grid grid-cols-8 gap-2">
                             {stickers.map(s => (
                                 <button key={s} onClick={() => handleSendSticker(s)} className="text-2xl hover:bg-gray-200 rounded p-1 transition">
                                     {s}
                                 </button>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
          )}
        </div>
      </div>
    );
  }

  // CLUB LIST VIEW
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Hero Header */}
      <div className="bg-dream-gradient text-white pt-12 pb-16 px-6 relative rounded-b-[3rem] shadow-xl mb-6">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2">My Clubs</h1>
            <p className="opacity-90">Browse, join, and chat with your community.</p>
            
             {/* Search Bar */}
             <div className="mt-6 relative max-w-lg">
                <input 
                    type="text" 
                    placeholder="Search for a club..." 
                    className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 shadow-lg border-none focus:ring-4 focus:ring-purple-300 outline-none transition"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
            </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-4xl mx-auto px-4 grid gap-4">
        {filteredClubs.length > 0 ? filteredClubs.map((club) => {
          const isMember = club.members.some((m) => (m._id || m) === user?._id);
          const isAdmin = club.admins?.some((a) => (a._id || a) === user?._id);

          return (
            <div 
              key={club._id} 
              onClick={() => isMember && setSelectedClub(club)}
              className={`bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition cursor-pointer border border-transparent ${isMember ? "ring-2 ring-purple-100" : ""}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${isMember ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"}`}>
                       {club.name[0]}
                   </div>
                   <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {club.name}
                            {isAdmin && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Admin</span>}
                        </h3>
                        <p className="text-slate-500 text-sm line-clamp-1">{club.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                             <span>👥 {club.members.length} Members</span>
                             {club.currentBook?.title && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">📖 {club.currentBook.title}</span>}
                        </div>
                   </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  {isMember ? (
                    <button onClick={() => setSelectedClub(club)} className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                      💬
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(club._id)}
                      className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-gray-700 transition"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
            <div className="text-center text-gray-400 py-10">
                <p>No clubs found matching "{searchQuery}".</p>
                <button onClick={() => setShowCreateModal(true)} className="mt-4 text-purple-600 font-bold hover:underline">Create one?</button>
            </div>
        )}
      </div>
      
      {/* Mobile Float Button */}
      <button 
        onClick={() => setShowCreateModal(true)} 
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl text-3xl hover:scale-110 transition z-20"
      >
          +
      </button>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6 font-serif">Start a Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Club Name</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border-none p-4 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                    value={newClub.name}
                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                    required
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                  <textarea
                    rows="3"
                    className="w-full bg-gray-50 border-none p-4 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                    value={newClub.description}
                    onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                    required
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Current Read (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border-none p-4 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                    value={newClub.currentBook}
                    onChange={(e) => setNewClub({ ...newClub, currentBook: e.target.value })}
                  />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition"
                >
                  Create Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
