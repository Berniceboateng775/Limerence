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
  onUpdateMessages
}) => {
  const { theme } = useTheme();
  const { token } = useContext(AuthContext);
  const [voting, setVoting] = useState(false);

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
             return <button key={i} onClick={(e)=>{e.stopPropagation();}} className="underline text-blue-400 break-all">{part}</button>
          } catch(e){}
        }
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300 break-all" onClick={e=>e.stopPropagation()}>{part}</a>;
      }
      return part;
    });
  };

  return (
    <div 
      ref={(el) => { 
        if (el && messageRefs && messageRefs.current) messageRefs.current[msg._id] = el;
        if (isFirstUnread && el && firstUnreadRef) firstUnreadRef.current = el;
      }}
      className={`flex flex-col mb-4 group ${calculatedIsMe ? "items-end" : "items-start"} relative animate-fade-in transition-all duration-300`}
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

      <div className="flex gap-2 max-w-[85%] md:max-w-[75%]">
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
        
        <div className="relative">
          <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${fontSizes[fontSize]} leading-relaxed break-words ${
            calculatedIsMe 
              ? "bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white rounded-tr-sm" 
              : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-tl-sm"
          }`}>
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
                    <img src={`http://localhost:5000${msg.attachment.url}`} className="rounded-lg max-h-64 object-cover" alt="" />
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
            
            <span className={msg.pending ? "opacity-70" : ""}>{renderWithLinks(msg.content)}</span>
            
            <span className={`text-[10px] opacity-70 block mt-1 text-right`}>
              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              {msg.pending && " • Sending..."}
            </span>
          </div>

          {/* Reactions */}
          {msg.reactions?.length > 0 && (
            <div className="flex gap-0.5 bg-white dark:bg-slate-700 shadow-md rounded-full px-1.5 py-0.5 border border-gray-100 dark:border-slate-600 mt-1 w-fit">
              {[...new Set(msg.reactions.map(r => r.emoji))].slice(0, 5).map((emoji, i) => (
                <span key={i} className="text-xs">{emoji}</span>
              ))}
              {msg.reactions.length > 1 && <span className="text-xs text-gray-500 ml-0.5">{msg.reactions.length}</span>}
            </div>
          )}

          {/* Action Menu (Hover) */}
          <div className={`absolute ${calculatedIsMe ? 'right-full mr-1' : 'left-full ml-1'} top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 bg-white dark:bg-slate-700 p-1 rounded-full shadow-lg border dark:border-slate-600 z-20`}>
            <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full text-sm" title="Reply">↩️</button>
            <button onClick={() => handleReaction(msg._id, "❤️")} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-sm">❤️</button>
            <button onClick={() => handleReaction(msg._id, "👍")} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full text-sm">👍</button>
            <button onClick={() => handleReaction(msg._id, "😂")} className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-full text-sm">😂</button>
            <button onClick={() => setReactionTarget(reactionTarget === msg._id ? null : msg._id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full text-sm">➕</button>
            {(selectedClub?.admins?.some(a => (a._id || a) === user._id) || calculatedIsMe) && (
              <button onClick={() => handleDeleteMessage(msg._id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-sm text-red-500" title="Delete message">🗑️</button>
            )}
          </div>
          
          {reactionTarget === msg._id && (
            <div className={`fixed z-[100] ${calculatedIsMe ? "right-[400px]" : "left-[400px]"} top-1/2 -translate-y-1/2`}>
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

export default ClubMessageBubble;
