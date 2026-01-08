import React, { useContext, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "./Toast";
import { useTheme } from "../context/ThemeContext";
import CustomAudioPlayer from "./CustomAudioPlayer";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

// Generate unique colors per USER
const getNameColor = (name, uniqueId) => {
  const nameColors = [
    "text-blue-600 dark:text-blue-400",
    "text-green-600 dark:text-green-400",
    "text-orange-600 dark:text-orange-400",
    "text-purple-600 dark:text-purple-400",
    "text-pink-600 dark:text-pink-400",
    "text-teal-600 dark:text-teal-400",
    "text-indigo-600 dark:text-indigo-400",
    "text-rose-600 dark:text-rose-400",
    "text-cyan-600 dark:text-cyan-400",
    "text-amber-600 dark:text-amber-400",
    "text-lime-600 dark:text-lime-400",
    "text-emerald-600 dark:text-emerald-400",
  ];
  const avatarColors = [
    "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500",
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
    "bg-cyan-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500",
  ];
  const hashStr = uniqueId || name || 'default';
  const hash = hashStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    name: nameColors[hash % nameColors.length],
    avatar: avatarColors[hash % avatarColors.length]
  };
};

const ClubMessageBubble = ({
  msg,
  isFirstUnread,
  user,
  selectedClub,
  fontSize,
  fontSizes,
  clubs,
  setShowJoinModal,
  scrollToMessage,
  fetchUserProfile,
  setReplyingTo,
  handleReaction,
  setReactionTarget,
  reactionTarget,
  handleDeleteMessage,
  messageRefs,
  firstUnreadRef,
  isMe,
  onUpdateMessages,
  handleForwardMessage
}) => {
  const { theme } = useTheme();
  const { token } = useContext(AuthContext);
  const [voting, setVoting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [activeReactionTab, setActiveReactionTab] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Max characters before showing "Read more"
  const MAX_CHARS = 300;
  const isLongText = (msg.content?.length || 0) > MAX_CHARS;

  // Close menu when clicking anywhere outside
  React.useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = () => setShowMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  // New Handlers
  const handlePin = async () => {
      try {
          const res = await axios.post(`/api/clubs/${selectedClub._id}/messages/${msg._id}/pin`, {}, { headers: { "x-auth-token": token } });
          if (onUpdateMessages) onUpdateMessages(res.data);
          toast(msg.pinned ? "Unpinned" : "Pinned", "success");
          setShowMenu(false);
      } catch (err) { toast(err.response?.data?.msg || "Failed to pin", "error"); }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(msg.content || "");
      toast("Copied!", "success");
      setShowMenu(false);
  };

  // IsMe Logic
  const senderId = msg.user?._id || msg.user;
  const calculatedIsMe = user?._id === senderId;
  const userColors = getNameColor(msg.username, senderId);

  // Poll Logic
  const handleVote = async (optionIndex) => {
      if (voting) return;
      setVoting(true);
      try {
          const res = await axios.post(`/api/clubs/${selectedClub._id}/messages/${msg._id}/vote`, 
             { optionIndex }, 
             { headers: { "x-auth-token": token } }
          );
          if (onUpdateMessages) onUpdateMessages(res.data);
      } catch (err) {
          toast(err.response?.data?.msg || "Vote failed", "error");
      } finally {
          setVoting(false);
      }
  };

  const renderPoll = () => {
    if (!msg.poll) return null;
    const totalVotes = msg.poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
    const userVoteIndex = msg.poll.options.findIndex(opt => opt.votes.includes(user._id));

    return (
        <div className={`mt-2 p-3 rounded-xl min-w-[250px] ${calculatedIsMe ? 'bg-white/10' : 'bg-black/5 dark:bg-white/5'}`}>
            <h4 className="font-bold text-sm mb-3 opacity-90">{msg.poll.question}</h4>
            <div className="space-y-2">
                {msg.poll.options.map((opt, idx) => {
                    const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                    const isSelected = userVoteIndex === idx;
                    return (
                        <div key={idx} className="relative">
                           <button 
                             onClick={() => handleVote(idx)}
                             disabled={voting}
                             className={`relative z-10 w-full text-left text-xs p-2 rounded-lg border transition-all flex justify-between items-center ${
                                 isSelected 
                                 ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold' 
                                 : 'border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                             }`}
                           >
                               <span>{opt.text}</span>
                               <span className="text-[10px]">{percent}%</span>
                           </button>
                           {/* Progress Bar Background */}
                           <div 
                             className={`absolute top-0 left-0 h-full rounded-lg transition-all duration-500 ${isSelected ? 'bg-purple-200/50 dark:bg-purple-900/30' : 'bg-gray-200/50 dark:bg-gray-700/50'}`} 
                             style={{ width: `${percent}%`, zIndex: 0 }}
                           />
                        </div>
                    );
                })}
            </div>
            <p className="text-[10px] opacity-60 mt-2 text-right">{totalVotes} votes</p>
        </div>
    );
  };

  // Helper to make URLs clickable
  const renderWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0;
        if (part.includes('/clubs?join=')) {
          try {
             const clubId = new URL(part).searchParams.get('join');
             return (
               <button 
                 key={i} 
                 onClick={async (e) => {
                   e.stopPropagation();
                   // Check if already in this club
                   const isMember = clubs?.some(c => c._id === clubId || c.club?._id === clubId);
                   if (isMember) {
                     toast("You're already in this club!", "info");
                     return;
                   }
                   // Show join modal with club info
                   if (setShowJoinModal) setShowJoinModal({ clubId, loading: true });
                   try {
                     const res = await axios.get(`/api/clubs/${clubId}`);
                     if (setShowJoinModal) setShowJoinModal({ clubId, club: res.data, loading: false });
                   } catch (err) {
                     toast("Failed to load club info", "error");
                     if (setShowJoinModal) setShowJoinModal(null);
                   }
                 }}
                 className="underline text-blue-400 hover:text-blue-300 break-all cursor-pointer"
               >
                 {part}
               </button>
             );
          } catch(e){}
        }
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300 break-all" onClick={e=>e.stopPropagation()}>{part}</a>;
      }
      return part;
    });
  };

  return (
    <div 
      id={`msg-${msg._id}`}
      ref={(el) => { 
        if (el && messageRefs && messageRefs.current) messageRefs.current[msg._id] = el;
        if (isFirstUnread && el && firstUnreadRef) firstUnreadRef.current = el;
      }}
      className={`flex flex-col mb-4 group ${calculatedIsMe ? "items-end" : "items-start"} relative animate-fade-in transition-all duration-300 max-w-full`}
      style={{ maxWidth: '100%' }}
    >
      {isFirstUnread && (
        <div className="w-full flex items-center justify-center my-4">
          <div className="flex-1 h-px bg-red-300 dark:bg-red-700"></div>
          <span className="px-3 text-xs font-bold text-red-500 dark:text-red-400">NEW MESSAGES</span>
          <div className="flex-1 h-px bg-red-300 dark:bg-red-700"></div>
        </div>
      )}

      {msg.replyTo && (
        <div 
          onClick={() => scrollToMessage(msg.replyTo.id || msg.replyTo._id)}
          className={`text-xs mb-2 p-2.5 rounded-lg border-l-4 max-w-[70%] cursor-pointer hover:opacity-80 transition ${
            calculatedIsMe 
              ? "bg-gray-100 dark:bg-slate-700 border-gray-400 dark:border-slate-500 text-gray-700 dark:text-gray-200" 
              : "bg-gray-100 dark:bg-slate-700 border-gray-400 dark:border-slate-500 text-gray-700 dark:text-gray-200"
          }`}
        >
          <span className="font-bold">{msg.replyTo.username}</span>: {msg.replyTo.content?.substring(0, 40)}...
        </div>
      )}

      <div className="flex gap-2 max-w-[50%]">
        {!calculatedIsMe && (
          <div 
            onClick={() => fetchUserProfile(msg.user)} 
            className={`w-9 h-9 rounded-full ${userColors.avatar} flex-shrink-0 cursor-pointer overflow-hidden shadow-md flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-slate-700`}
          >
            {msg.user?.avatar ? (
              <img src={`http://localhost:5000${msg.user.avatar}`} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-sm font-bold">{msg.username?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
        )}
        
        <div className="relative max-w-[70%]" style={{ maxWidth: 'min(70%, 500px)' }}>
          {/* Forwarded label */}
          {msg.isForwarded && (
            <div className="text-[10px] italic text-gray-400 dark:text-gray-500 mb-0.5">
              ↪ Forwarded
            </div>
          )}
          <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${fontSizes[fontSize]} leading-relaxed break-words whitespace-pre-wrap overflow-hidden ${
            calculatedIsMe 
              ? "bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white rounded-tr-sm" 
              : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-tl-sm"
          }`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {!calculatedIsMe && (
              <span 
                className={`block text-[12px] font-bold mb-0.5 cursor-pointer hover:underline ${userColors.name}`}
                onClick={() => fetchUserProfile(msg.user)}
              >
                {msg.username}
              </span>
            )}
            
            {msg.poll && renderPoll()}

            {msg.attachment && (
              <div className="mb-2">
                {msg.attachment.fileType === 'image' ? (
                  <div className="relative group/img">
                    <img src={`http://localhost:5000${msg.attachment.url}`} className="rounded-lg max-h-64 max-w-full object-cover" alt="" />
                    <a 
                      href={`http://localhost:5000${msg.attachment.url}`} 
                      download 
                      className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition"
                      title="Download"
                    >
                      ⬇️
                    </a>
                  </div>
                ) : msg.attachment.fileType === 'audio' ? (
                  <CustomAudioPlayer src={`http://localhost:5000${msg.attachment.url}`} dark={calculatedIsMe} />
                ) : (
                  <div className="bg-black/5 dark:bg-white/10 p-3 rounded-lg flex items-center gap-3 border border-black/5 select-none">
                     <div className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-xl">
                       📄
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold truncate">{msg.attachment.name}</p>
                       <p className="text-[10px] opacity-70 uppercase">{msg.attachment.url.split('.').pop()}</p>
                     </div>
                     <a 
                       href={`http://localhost:5000${msg.attachment.url}`} 
                       download 
                       className="p-2 hover:bg-black/10 rounded-full transition" 
                       title="Download"
                     >
                       ⬇️
                     </a>
                  </div>
                )}
              </div>
            )}
            
            {/* Text content with Read more for long messages */}
            {msg.content && (
              <div className={msg.pending ? "opacity-70" : ""}>
                {isLongText && !isExpanded ? (
                  <>
                    {renderWithLinks(msg.content.slice(0, MAX_CHARS))}...
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                      className="text-purple-500 dark:text-purple-400 text-xs font-bold ml-1 hover:underline"
                    >
                      Read more
                    </button>
                  </>
                ) : (
                  <>
                    {renderWithLinks(msg.content)}
                    {isLongText && isExpanded && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                        className="text-purple-500 dark:text-purple-400 text-xs font-bold ml-1 hover:underline"
                      >
                        Show less
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            
            <span className={`text-[10px] opacity-70 block mt-1 text-right`}>
              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              {msg.pending && " • Sending..."}
            </span>
          </div>

          {/* Reactions - click shows who reacted */}
          {msg.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {[...new Set(msg.reactions.map(r => r.emoji))].map((emoji, i) => {
                  const isReactedByMe = msg.reactions.some(r => r.emoji === emoji && r.user === user._id);
                  const count = msg.reactions.filter(r => r.emoji === emoji).length;
                  return (
                    <button 
                        key={i} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          // Open reactions modal to show who reacted
                          setActiveReactionTab('all');
                          setShowReactionsModal(true);
                        }}
                        className={`text-xs px-1.5 py-0.5 rounded-full border transition-all ${
                            isReactedByMe 
                            ? "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800" 
                            : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                        }`}
                    >
                        {emoji} {count > 1 && <span className="ml-0.5 text-[10px] opacity-70">{count}</span>}
                    </button>
                  );
              })}
            </div>
          )}

          {/* Action Menu Trigger (Chevron) */ }
          <div className={`absolute top-0 ${calculatedIsMe ? '-left-7' : '-right-7'} opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
             <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full shadow border dark:border-slate-600 text-gray-500 hover:text-purple-500 bg-opacity-90 backdrop-blur-sm"
             >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7"></path></svg>
             </button>

             {/* Dropdown Menu */}
             {showMenu && (
                <div className={`absolute ${calculatedIsMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-gray-100 dark:border-slate-700 py-2 w-48 z-50 text-sm animate-fade-in click-stops-propagation`} onClick={e => e.stopPropagation()}>
                    {/* Quick Reactions */}
                    <div className="flex justify-between px-3 pb-2 border-b border-gray-100 dark:border-slate-700 mb-1">
                        {["❤️", "😂", "😮", "👍", "👎"].map(emoji => (
                             <button key={emoji} onClick={() => { handleReaction(msg._id, emoji); setShowMenu(false); }} className="hover:scale-125 transition text-lg">{emoji}</button>
                        ))}
                        <button onClick={() => { setReactionTarget(msg._id); setShowMenu(false); }} className="hover:scale-125 transition text-lg">➕</button>
                    </div>

                    <button onClick={() => { setReplyingTo(msg); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                        <span>↩️</span> Reply
                    </button>
                    <button onClick={handleCopy} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                        <span>📋</span> Copy text
                    </button>
                    <button onClick={handlePin} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                        <span>📌</span> {msg.pinned ? "Unpin message" : "Pin message"}
                    </button>
                    <button onClick={() => { handleForwardMessage && handleForwardMessage(msg); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                        <span>➡️</span> Forward
                    </button>
                    
                    {(selectedClub?.admins?.some(a => (a._id || a) === user._id) || calculatedIsMe) && (
                        <button onClick={() => { handleDeleteMessage(msg._id); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center gap-3">
                            <span>🗑️</span> Delete
                        </button>
                    )}
                </div>
             )}
          </div>
          
          {reactionTarget === msg._id && (
            <div className={`absolute ${calculatedIsMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 z-[100]`}>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border dark:border-slate-700" onClick={e=>e.stopPropagation()}>
                <div className="flex justify-between items-center p-2 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Choose Reaction</span>
                  <button onClick={() => setReactionTarget(null)} className="text-gray-400 hover:text-red-500 font-bold px-2">×</button>
                </div>
                <EmojiPicker 
                  width={320} 
                  height={350} 
                  theme={theme}
                  previewConfig={{ showPreview: false }}
                  onEmojiClick={(e) => { handleReaction(msg._id, e.emoji); setReactionTarget(null); }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Reactions Modal - shows who reacted */}
      {showReactionsModal && msg.reactions?.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={() => setShowReactionsModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-700 overflow-x-auto">
              <button 
                onClick={() => setActiveReactionTab('all')}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap ${activeReactionTab === 'all' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
              >
                All {msg.reactions.length}
              </button>
              {[...new Set(msg.reactions.map(r => r.emoji))].map((emoji, i) => {
                const count = msg.reactions.filter(r => r.emoji === emoji).length;
                return (
                  <button 
                    key={i}
                    onClick={() => setActiveReactionTab(emoji)}
                    className={`px-4 py-3 text-sm whitespace-nowrap flex items-center gap-1 ${activeReactionTab === emoji ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                  >
                    {emoji} {count}
                  </button>
                );
              })}
            </div>
            {/* User List */}
            <div className="max-h-60 overflow-y-auto p-2">
              {msg.reactions
                .filter(r => activeReactionTab === 'all' || r.emoji === activeReactionTab)
                .map((reaction, idx) => {
                  const reactorName = selectedClub?.members?.find(m => (m._id || m) === reaction.user)?.name || 'User';
                  const reactorAvatar = selectedClub?.members?.find(m => (m._id || m) === reaction.user)?.avatar;
                  const colors = getNameColor(reactorName, reaction.user);
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${colors.avatar} flex items-center justify-center text-white font-bold overflow-hidden`}>
                          {reactorAvatar ? (
                            <img src={`http://localhost:5000${reactorAvatar}`} className="w-full h-full object-cover" alt="" />
                          ) : (
                            reactorName?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{reactorName}</span>
                      </div>
                      <span className="text-xl">{reaction.emoji}</span>
                    </div>
                  );
                })}
            </div>
            {/* Close Button */}
            <div className="p-3 border-t border-gray-100 dark:border-slate-700">
              <button 
                onClick={() => setShowReactionsModal(false)}
                className="w-full py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubMessageBubble;
