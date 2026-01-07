import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NotificationContext } from "../context/NotificationContext";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { toast } from "../components/Toast";
import CustomAudioPlayer from "../components/CustomAudioPlayer";
import AttachmentMenu from "../components/AttachmentMenu";
import CameraModal from "../components/CameraModal";
import socket from "../socket";
import ConfirmModal from "../components/ConfirmModal";

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
  const { fetchUnreadDMs } = useContext(NotificationContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
  
  // Pin/Favorite States
  const [pinnedFriends, setPinnedFriends] = useState([]);
  const [favoriteFriends, setFavoriteFriends] = useState([]);
  const [friendFilterTab, setFriendFilterTab] = useState("all"); // "all" | "favorites"
  const [bestie, setBestie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // New States for UI Overhaul
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const documentInputRef = useRef(null); // For generic files
  
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default w-96 (384px)
  const [isResizing, setIsResizing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null); // Menu state

  // Real-time states
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, targetId: null, title: "", message: "" });
  
  // Message Action Menu State
  const [messageMenuId, setMessageMenuId] = useState(null);

  // Open confirmation modal for actions
  const openConfirmModal = (action, targetId, title, message) => {
    setConfirmModal({ isOpen: true, action, targetId, title, message });
    setActiveMenuId(null);
  };
  
  const handleConfirmAction = async () => {
    const { action, targetId } = confirmModal;
    setConfirmModal({ isOpen: false, action: null, targetId: null, title: "", message: "" });
    
    if (action === "block") {
      try {
        await axios.post(`/api/users/block/${targetId}`, {}, { headers: { "x-auth-token": token } });
        toast("User blocked", "success");
        setFriends(prev => prev.filter(f => f._id !== targetId));
        if (selectedFriend?._id === targetId) setSelectedFriend(null);
      } catch (err) {
        toast("Failed to block user", "error");
      }
    } else if (action === "deleteChat") {
      try {
        await axios.delete(`/api/dm/${targetId}`, { headers: { "x-auth-token": token } });
        toast("Chat deleted", "success");
        setLastMessages(prev => ({ ...prev, [targetId]: null }));
        if (selectedFriend?._id === targetId) setMessages([]);
      } catch (err) {
        toast("Failed to delete chat", "error");
      }
    } else if (action === "deleteMessage") {
      // For message deletion
      await confirmDelete("everyone");
    }
  };
  
  // Use useRef to avoid closure issues in event listener if needed, but state works fine here
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((mouseMoveEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX - (window.innerWidth - 1280 > 0 ? (window.innerWidth - 1280) / 2 : 0); // Adjust for container mx-auto if needed?
      // Wait, Friends page has max-w-7xl mx-auto (line 623). clientX is absolute.
      // We need relative mouse position or just use clientX if sidebar is on left edge.
      // Friends page has pt-20 and max-w-7xl mx-auto. This makes resizing tricky if centered.
      // However, the requested sidebar is seemingly the one inside the card.
      // Let's assume user wants to resize the split between friend list and chat.
      // The friend list is usually on the left.
      // Simpler approach: current sidebar width + delta movement.
      // Or just map clientX to width if sidebar is left-aligned.
      // The Friends component has `max-w-7xl mx-auto`, so content is centered.
      // This makes simple clientX mapping inaccurate if window > 7xl.
      
      // Better approach for centered container: 
      // Calculate width based on mouse delta? Or get container offset.
      // For now, let's just allow resizing based on movement, or assume simplistic resizing.
      // Actually, if I use a ref for the sidebar container, I can get its left position.
    }
  }, [isResizing]);
  
  // Revised resize logic below using ref
  const sidebarRef = useRef(null); 
  const resizeHandler = useCallback((e) => {
    if (isResizing && sidebarRef.current) {
        const containerLeft = sidebarRef.current.getBoundingClientRect().left;
        const newWidth = e.clientX - containerLeft;
        if (newWidth > 250 && newWidth < 600) setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resizeHandler);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resizeHandler);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resizeHandler, stopResizing]);

  // Socket Connection & Listeners
  useEffect(() => {
    if (user) {
        if (!socket.connected) {
            socket.on("connect", () => {
                console.log("Socket connected, joining", user.userId);
                socket.emit("join", user.userId);
            });
            socket.connect();
        } else {
            socket.emit("join", user.userId);
        }

        socket.on("onlineUsers", (users) => {
            setOnlineUsers(users || []);
        });

        socket.on("typing", ({ fromUsername, isClub }) => {
           if (!isClub) {
               // We identify by username for now as simple visual
               setTypingUsers(prev => new Set(prev).add(fromUsername));
           }
        });
        
        socket.on("stopTyping", ({ fromUsername }) => {
            setTypingUsers(prev => {
                const n = new Set(prev);
                n.delete(fromUsername);
                return n;
            });
        });
    }

    return () => {
        socket.off("onlineUsers");
        socket.off("typing");
        socket.off("stopTyping");
    };
  }, [user]);

  // Typing Emitters
  useEffect(() => {
    if (newMessage) {
        // Emit typing to selected friend
        if (selectedFriend) {
            socket.emit("typing", { to: selectedFriend._id, fromUsername: user?.name, isClub: false });
            const timeout = setTimeout(() => socket.emit("stopTyping", { to: selectedFriend._id, fromUsername: user?.name, isClub: false }), 3000);
            return () => clearTimeout(timeout);
        }
    }
  }, [newMessage, selectedFriend, user]);

  // Click outside to close menus (message menu, friend menu)
  useEffect(() => {
    const handleClickOutside = () => {
      setMessageMenuId(null);
      setActiveMenuId(null);
      setShowReactionPicker(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

  // Fetch pins/favorites on mount
  const fetchMyPinsFavorites = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/users/my-pins-favorites", {
        headers: { "x-auth-token": token }
      });
      setPinnedFriends(res.data.pinnedFriends?.map(f => f._id || f) || []);
      setFavoriteFriends(res.data.favoriteFriends?.map(f => f._id || f) || []);
      setBestie(res.data.bestie || null);
    } catch (err) { console.error(err); }
  };

  // Toggle pin friend
  const handleTogglePinFriend = async (friendId, e) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`/api/users/pin-friend/${friendId}`, {}, {
        headers: { "x-auth-token": token }
      });
      setPinnedFriends(res.data.pinnedFriends.map(id => id.toString()));
      toast(pinnedFriends.includes(friendId) ? "Unpinned" : "Pinned!", "success");
    } catch (err) {
      toast(err.response?.data?.msg || "Failed to pin", "error");
    }
  };

  // Toggle favorite friend
  const handleToggleFavoriteFriend = async (friendId, e) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`/api/users/favorite-friend/${friendId}`, {}, {
        headers: { "x-auth-token": token }
      });
      setFavoriteFriends(res.data.favoriteFriends.map(id => id.toString()));
      toast(favoriteFriends.includes(friendId) ? "Removed from favorites" : "Added to favorites!", "success");
    } catch (err) {
      toast("Failed to favorite", "error");
    }
  };

  useEffect(() => { fetchFriends(); fetchMyPinsFavorites(); }, []);

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
              content: lastMsg.content || (
                lastMsg.attachmentType === 'image' ? '📷 Photo' : 
                lastMsg.attachmentType === 'voice' ? '🎤 Voice message' : 
                lastMsg.attachmentType === 'file' ? '📄 Document' : 
                lastMsg.attachmentType === 'video' ? '🎥 Video' : 
                lastMsg.attachmentType === 'location' ? '📍 Location' : ''
              ),
              time: new Date(lastMsg.createdAt),
              isMe: (lastMsg.sender?._id || lastMsg.sender) === user._id
            };
            // Count unread based on timestamps (Club Logic)
            const myReadInfo = convRes.data.lastReadBy?.find(r => r.user === user._id || r.user?._id === user._id);
            const lastReadAt = myReadInfo ? new Date(myReadInfo.lastReadAt).getTime() : 0;

            unreads[friend._id] = msgs.filter(m => 
              (m.sender?._id || m.sender) !== user._id && 
              new Date(m.createdAt).getTime() > lastReadAt
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
      
      // Mark as read on backend & update navbar
      await axios.post(`/api/dm/${friendId}/read`, {}, { headers: { "x-auth-token": token } });
      fetchUnreadDMs();
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

  const handleCustomWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedFriend) {
      try {
        const formData = new FormData();
        formData.append("wallpaper", file);
        
        toast("Uploading wallpaper...", "info");
        const res = await axios.post("/api/users/upload-wallpaper", formData, {
            headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
        });
        
        const fullUrl = `http://localhost:5000${res.data.url}`;
        setFriendCustomWallpapers(prev => ({ ...prev, [selectedFriend._id]: fullUrl }));
        setFriendWallpapers(prev => ({ ...prev, [selectedFriend._id]: 'custom' }));
        setShowWallpaperPicker(false);
        toast("Wallpaper uploaded!", "success");
      } catch (err) {
        console.error(err);
        toast("Failed to upload wallpaper", "error");
      }
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



  /* Attachment Handlers */
  const handleAttachmentSelect = (type) => {
    setShowAttachmentMenu(false);
    if (type === 'image') fileInputRef.current?.click();
    if (type === 'file') documentInputRef.current?.click();
    if (type === 'camera') setCameraOpen(true);
    if (type === 'location') sendLocation();
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      toast("Geolocation not supported", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setPendingLocation({ latitude, longitude });
      toast("Location captured! Click send to share.", "success");
    }, () => toast("Location access denied", "error"));
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };



  const handleCameraCapture = (file) => {
    setAttachment(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    // Auto-send or let user confirm? User logic implies send like image.
    // Existing logic uses `attachment` state + sendImage.
    // We already set attachment, so user sees preview and clicks send.
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
      fetchFriends();
      toast("Voice note sent!", "success");
    } catch (err) {
      toast("Failed to send", "error");
    }
  };

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (event.target.closest('.emoji-picker-container') || 
            event.target.closest('.attachment-menu-container') ||
            event.target.closest('.recording-ui')) return;
            
        setShowEmojiPicker(null);
        setShowAttachmentMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Unified Send Message Logic */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment && !audioBlob && !pendingLocation) return;
    if (!selectedFriend) return;

    try {
      const formData = new FormData();
      let contentToSend = newMessage;

      // Handle Location
      if (pendingLocation) {
        contentToSend = (contentToSend ? contentToSend + "\n" : "") + `https://www.google.com/maps?q=${pendingLocation.latitude},${pendingLocation.longitude}`;
        formData.append('attachmentType', 'location');
      } 
      // Handle Attachments (Image/File)
      else if (attachment) {
        formData.append('attachment', attachment);
        if (attachment.type.startsWith('image')) {
            formData.append('attachmentType', 'image');
        } else if (attachment.type.startsWith('video')) {
            formData.append('attachmentType', 'video');
        } else {
            formData.append('attachmentType', 'file');
        }
      }

      formData.append('content', contentToSend);

      if (replyingTo) {
        formData.append('replyToId', replyingTo._id);
        formData.append('replyToContent', replyingTo.content);
        formData.append('replyToUsername', replyingTo.sender?.name || 'Unknown');
      }

      const res = await axios.post(`/api/dm/${selectedFriend._id}/message`, formData, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
      });

      setMessages(prev => [...prev, res.data]);
      setNewMessage(""); 
      setReplyingTo(null);
      setAttachment(null);
      setImagePreview(null);
      setPendingLocation(null);
      setAudioBlob(null);
      fetchFriends();
      toast("Sent!", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to send", "error");
    }
  };

  const addReaction = async (messageId, emoji) => {
    if (!selectedFriend) return;
    try {
      await axios.post(`/api/dm/${selectedFriend._id}/message/${messageId}/reaction`, { emoji }, { headers: { "x-auth-token": token } });
      await fetchConversation(selectedFriend._id);
      setShowReactionPicker(null);
      setMessageMenuId(null);
    } catch (err) {
      console.error("Reaction error:", err);
      toast("Failed to react", "error");
    }
  };

  const confirmDelete = async (mode) => {
    if (!deleteTarget || !selectedFriend) return;
    try {
      await axios.delete(`/api/dm/${selectedFriend._id}/message/${deleteTarget._id}`, {
        data: { mode },
        headers: { "x-auth-token": token }
      });
      // Update local state by filtering out deleted message (faster UI)
      setMessages(prev => prev.filter(m => m._id !== deleteTarget._id));
      fetchFriends();
      
      // Also fetch to be sure
      // fetchConversation(selectedFriend._id); 
      toast("Message deleted", "success");
    } catch (err) {
      toast(err.response?.data?.msg || "Failed to delete", "error");
    } finally {
      setDeleteTarget(null);
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
            <div className={`px-4 py-2.5 rounded-[18px] shadow-md relative text-[15px] leading-relaxed break-words ${
              isMe ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md" : "bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-100 dark:border-slate-600"
            }`}>
              {!isMe && <span className="block text-[12px] font-bold mb-0.5 text-purple-600 dark:text-purple-400">{senderName}</span>}
              
              {msg.attachmentType === 'image' && msg.attachment && (
                <div className="relative group">
                  <img src={`http://localhost:5000${msg.attachment}`} alt="Shared" 
                    className="max-w-[280px] max-h-[300px] rounded-lg mb-2 cursor-pointer object-cover hover:brightness-95 transition"
                    onClick={() => window.open(`http://localhost:5000${msg.attachment}`, '_blank')}
                  />
                  <a href={`http://localhost:5000${msg.attachment}`} download target="_blank" rel="noopener noreferrer" 
                     className="absolute bottom-4 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
                     onClick={(e) => e.stopPropagation()}>
                    ⬇
                  </a>
                </div>
              )}
              
              {msg.attachmentType === 'voice' && msg.attachment && (
                <div className="mb-2">
                   <CustomAudioPlayer src={`http://localhost:5000${msg.attachment}`} dark={isMe} />
                </div>
              )}

              {msg.attachmentType === 'file' && msg.attachment && (
                <div className="mb-2">
                   <div className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-purple-600' : 'bg-gray-100 dark:bg-slate-800'}`}>
                     <div className="text-2xl">📄</div>
                     <div className="flex-1 min-w-0">
                       <p className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                         {msg.attachment.split('/').pop()}
                       </p>
                       <p className={`text-xs opacity-70 ${isMe ? 'text-purple-200' : 'text-gray-500'}`}>Document</p>
                     </div>
                     <a href={`http://localhost:5000${msg.attachment}`} download target="_blank" rel="noopener noreferrer" 
                        className={`p-2 rounded-full ${isMe ? 'hover:bg-purple-500' : 'hover:bg-gray-200 dark:hover:bg-slate-700'} transition`}>
                       ⬇
                     </a>
                   </div>
                </div>
              )}
              
              {msg.content && <p>{renderWithLinks(msg.content)}</p>}
              
              <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMe ? 'text-purple-200' : 'opacity-50'}`}>
                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isMe && (
                  <span className={msg.readBy?.length > 0 ? 'text-blue-300' : 'text-purple-300'}>
                    {msg.readBy?.length > 0 ? '✓✓' : (onlineUsers.includes(selectedFriend?._id) ? '✓✓' : '✓')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Reactions Display - Inline below bubble (clickable to toggle) */}
            {msg.reactions?.length > 0 && (
              <div className="flex gap-0.5 bg-white dark:bg-slate-600 rounded-full px-2 py-1 shadow-md mt-1 w-fit cursor-pointer">
                {[...new Set(msg.reactions.map(r => r.emoji))].slice(0, 5).map((emoji, i) => (
                  <span 
                    key={i} 
                    className="text-sm hover:scale-125 transition cursor-pointer"
                    onClick={() => addReaction(msg._id, emoji)}
                  >{emoji}</span>
                ))}
              </div>
            )}
            
            {/* WhatsApp-style Dropdown Trigger - at TOP of message */}
            <button 
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMessageMenuId(messageMenuId === msg._id ? null : msg._id); setShowReactionPicker(null); }}
              className={`absolute ${isMe ? '-left-7' : '-right-7'} top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100 dark:hover:bg-slate-600 z-20 border border-gray-200 dark:border-slate-600`}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-gray-500 dark:text-gray-300">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </button>
            
            {/* Vertical Action Menu - appears beside text at top */}
            {messageMenuId === msg._id && !isReactionPickerOpen && (
              <div 
                className={`absolute ${isMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 z-50 overflow-hidden`}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              >
                {/* Quick Reactions Row */}
                <div className="flex items-center justify-around p-2 border-b border-gray-100 dark:border-slate-700">
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                    <button key={emoji} 
                      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); addReaction(msg._id, emoji); setMessageMenuId(null); }}
                      className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-lg transition hover:scale-110">
                      {emoji}
                    </button>
                  ))}
                  <button 
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowReactionPicker(msg._id); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-lg transition">
                    +
                  </button>
                </div>
                {/* Menu Items with Text */}
                <button 
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setReplyingTo(msg); setMessageMenuId(null); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <span>↩️</span> Reply
                </button>
                <button 
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigator.clipboard.writeText(msg.content || ''); toast('Copied!', 'success'); setMessageMenuId(null); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <span>📋</span> Copy
                </button>
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <span>↗️</span> Forward
                </button>
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <span>📌</span> Pin
                </button>
                <div className="h-px bg-gray-100 dark:bg-slate-700"></div>
                <button 
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteTarget(msg); setMessageMenuId(null); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-red-500">
                  <span>🗑️</span> Delete
                </button>
              </div>
            )}
            
            {/* Compact Emoji Picker - replaces menu when + clicked */}
            {isReactionPickerOpen && (
              <div 
                className={`absolute ${isMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 z-50`}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              >
                <EmojiPicker 
                  onEmojiClick={(emojiData) => { addReaction(msg._id, emojiData.emoji); setShowReactionPicker(null); setMessageMenuId(null); }} 
                  theme="dark" 
                  height={320} 
                  width={320}
                  previewConfig={{ showPreview: false }}
                  searchDisabled
                  skinTonesDisabled
                />
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
          <div 
            ref={sidebarRef}
            className="bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex flex-col relative group/sidebar select-none"
            style={{ width: sidebarWidth }}
          >
            {/* Resize Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-500/50 z-50 transition-colors"
               onMouseDown={startResizing}
            />
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
            
            {/* Search and Filter Tabs */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-700">
              <input 
                type="text" 
                placeholder="Search friends..." 
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-2 px-4 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none dark:text-white dark:placeholder-gray-400 transition mb-2"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setFriendFilterTab("all")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    friendFilterTab === "all" 
                      ? "bg-purple-500 text-white" 
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  All Friends
                </button>
                <button
                  onClick={() => setFriendFilterTab("favorites")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    friendFilterTab === "favorites" 
                      ? "bg-purple-500 text-white" 
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setFriendFilterTab("unread")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    friendFilterTab === "unread" 
                      ? "bg-purple-500 text-white" 
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  Unread
                </button>
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
                // Filter, search, and sort friends
                friends
                  .filter(f => f.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .filter(f => {
                    if (friendFilterTab === "favorites") return favoriteFriends.includes(f._id);
                    if (friendFilterTab === "unread") return unreadCounts[f._id] > 0;
                    return true;
                  })
                  .sort((a, b) => {
                    // Pinned friends first
                    const aIsPinned = pinnedFriends.includes(a._id);
                    const bIsPinned = pinnedFriends.includes(b._id);
                    if (aIsPinned && !bIsPinned) return -1;
                    if (!aIsPinned && bIsPinned) return 1;
                    return 0; // Keep original order for unpinned
                  })
                  .map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => { setSelectedFriend(friend); setViewProfile(null); }}
                    className={`group relative flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 border-b border-gray-50 dark:border-slate-700/50 h-[72px] ${
                      selectedFriend?._id === friend._id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                    onContextMenu={(e) => { e.preventDefault(); setActiveMenuId(friend._id); }}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full ${getAvatarColor(friend.name)} flex items-center justify-center text-white text-lg font-bold overflow-hidden shadow-sm`}>
                        {friend.avatar ? (
                          <img src={`http://localhost:5000${friend.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : (
                          friend.name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      {bestie === friend._id && (
                        <div className="absolute -bottom-1 -right-1 text-sm bg-white dark:bg-slate-800 rounded-full p-[1px]" title="Bestie">😍</div>
                      )}
                      {pinnedFriends.includes(friend._id) && (
                         <div className="absolute top-0 -left-1 text-[10px] bg-white dark:bg-slate-800 rounded-full shadow-sm px-1">📌</div>
                      )}
                      {favoriteFriends.includes(friend._id) && (
                         <div className="absolute top-0 -right-1 text-[10px] bg-white dark:bg-slate-800 rounded-full shadow-sm px-1">⭐</div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full border-b border-transparent group-hover:border-transparent">
                      <div className="flex justify-between items-baseline mb-1">
                         <h3 className="font-bold text-gray-900 dark:text-white truncate text-[15px]">{friend.name}</h3>
                         {lastMessages[friend._id] && (
                            <span className={`text-[11px] ${unreadCounts[friend._id] > 0 ? 'text-green-500 font-bold' : 'text-gray-400'}`}>
                              {formatTime(lastMessages[friend._id].time)}
                            </span>
                         )}
                      </div>
                      
                      <div className="flex justify-between items-center relative">
                         <div className="flex items-center gap-1 text-[13px] text-gray-500 truncate dark:text-gray-400 w-[85%]">
                            {typingUsers.has(friend.name) ? (
                                <span className="text-green-500 font-bold italic animate-pulse">typing...</span>
                            ) : (
                                <>
                                    {lastMessages[friend._id]?.isMe && (
                                        <span className={lastMessages[friend._id].read ? "text-blue-500" : "text-gray-400"}>
                                            {lastMessages[friend._id].read ? "✓✓" : (onlineUsers.includes(friend._id) ? "✓✓" : "✓")} 
                                        </span>
                                    )}
                                    <span className="truncate">
                                        {lastMessages[friend._id]?.content || <span className="italic">Click to start chatting</span>}
                                    </span>
                                </>
                            )}
                         </div>
                         
                         {/* Hover Menu Trigger - Absolute Right */}
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                            {unreadCounts[friend._id] > 0 && activeMenuId !== friend._id && (
                                <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 h-4 flex items-center justify-center rounded-full mr-2">
                                    {unreadCounts[friend._id]}
                                </span>
                            )}
                            
                            <button
                               onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === friend._id ? null : friend._id); }}
                               className={`w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all ${activeMenuId === friend._id || (activeMenuId === null && 'opacity-0 group-hover:opacity-100') ? 'opacity-100 bg-gray-200 dark:bg-slate-600' : 'opacity-0'}`}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path></svg>
                            </button>
                         </div>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {activeMenuId === friend._id && (
                       <div className="absolute top-10 right-4 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 z-[60] py-1 text-gray-800 dark:text-gray-200 font-sans" onClick={e => e.stopPropagation()}>
                           <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm flex items-center gap-3">
                               <span>📂</span> Archive chat
                           </button>
                           <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm flex items-center gap-3">
                               <span>📌</span> {pinnedFriends.includes(friend._id) ? "Unpin chat" : "Pin chat"}
                           </button>
                           <button onClick={(e) => { setActiveMenuId(null); setUnreadCounts(prev => ({...prev, [friend._id]: (prev[friend._id] || 0) + 1})); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm flex items-center gap-3">
                               <span>📝</span> Mark as unread
                           </button>
                           <button onClick={(e) => { setActiveMenuId(null); handleToggleFavoriteFriend(friend._id, e); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm flex items-center gap-3">
                               <span>{favoriteFriends.includes(friend._id) ? "⭐" : "☆"}</span> {favoriteFriends.includes(friend._id) ? "Remove favorite" : "Add favorite"}
                           </button>
                           <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                           <button onClick={() => openConfirmModal('block', friend._id, 'Block User', `Block ${friend.name}? They won't be able to message you.`)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-red-500 flex items-center gap-3">
                               <span>🚫</span> Block
                           </button>
                           <button onClick={() => openConfirmModal('deleteChat', friend._id, 'Delete Chat', 'Delete this entire chat history? This cannot be undone.')} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-red-500 flex items-center gap-3">
                               <span>🗑️</span> Delete chat
                           </button>
                       </div>
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
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-full ${getAvatarColor(selectedFriend.name)} flex items-center justify-center text-white font-bold overflow-hidden shadow`}>
                        {selectedFriend.avatar ? (
                          <img src={`http://localhost:5000${selectedFriend.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : selectedFriend.name?.[0]?.toUpperCase()}
                      </div>
                      {onlineUsers.includes(selectedFriend._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{selectedFriend.name}</h3>
                      <p className={`text-xs ${onlineUsers.includes(selectedFriend._id) ? 'text-green-500' : 'text-gray-400'}`}>
                        {onlineUsers.includes(selectedFriend._id) ? 'Online' : 'Offline'} • Tap for info
                      </p>
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
                

            {/* Chat Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
              
              {/* Location Preview */}
              {pendingLocation && (
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg mb-2 w-fit">
                    <span className="text-2xl">📍</span>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs text-gray-500 dark:text-gray-400">Location selected</p>
                       <p className="text-sm font-bold text-purple-700 dark:text-purple-300">Ready to share</p>
                    </div>
                    <button onClick={() => setPendingLocation(null)} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              )}

              {/* Attachment Preview (Image or File) */}
              {attachment && (
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg mb-2">
                   {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                   ) : (
                      <span className="text-2xl">📄</span>
                   )}
                   <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Selected File</p>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300 max-w-[200px] truncate">{attachment.name}</p>
                   </div>
                   <button onClick={() => { setAttachment(null); setImagePreview(null); }} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              )}
        
              {/* Audio Preview */}
              {audioBlob && (
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg mb-2 w-fit animate-fade-in">
                   <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 max-w-[200px]" />
                   <button onClick={() => setAudioBlob(null)} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              )}

              {replyingTo && (
                <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-700 p-2 rounded-lg mb-2 text-sm border-l-4 border-purple-500">
                  <span className="text-gray-600 dark:text-gray-300">Replying to <b>{replyingTo.sender?.name}</b></span>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500 px-2">✕</button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2 items-end relative">
                <div className="emoji-picker-container relative">
                   <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-2xl hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition text-gray-400">
                     <span className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition">😊</span>
                   </button>
                   {showEmojiPicker && (
                     <div className="absolute bottom-14 left-0 z-40 shadow-2xl rounded-2xl animate-fade-in-up">
                       <EmojiPicker onEmojiClick={onEmojiClick} theme={theme} height={400} />
                     </div>
                   )}
                </div>
                
                {/* Attachment Menu Trigger */}
                <div className="attachment-menu-container relative">
                  <button 
                    type="button" 
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
                    className="p-3 text-xl hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition text-gray-400 hover:text-purple-600"
                  >
                    ➕
                  </button>
                  {showAttachmentMenu && (
                    <div className="absolute bottom-16 left-0 z-50 animate-fade-in-up">
                      <AttachmentMenu onSelect={handleAttachmentSelect} />
                    </div>
                  )}
                </div>
                
                {/* Hidden Inputs */}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                <input type="file" ref={documentInputRef} className="hidden" onChange={handleDocumentSelect} />

                <button type="button" onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 text-xl rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-200 dark:ring-900' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-purple-600'}`}>
                  {isRecording ? '⏹️' : '🎙️'}
                </button>
                
                <textarea 
                  className={`flex-1 bg-gray-100 dark:bg-slate-700 border-none rounded-2xl p-3 outline-none resize-none max-h-32 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 dark:text-white dark:placeholder-gray-400 transition min-h-[48px]`}
                  placeholder="Type a message..." 
                  rows="1"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                />
                
                {audioBlob ? (
                   <button 
                     type="button"
                     onClick={sendVoiceNote}
                     className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg hover:from-green-600 hover:to-emerald-600 transition w-12 h-12 flex items-center justify-center animate-scale-up"
                   >
                     ➤
                   </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim() && !attachment}
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:from-purple-600 hover:to-pink-600 transition w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➤
                  </button>
                )}
              </form>
              

            </div>
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

      <CameraModal 
         isOpen={cameraOpen} 
         onClose={() => setCameraOpen(false)}
         onCapture={handleCameraCapture}
      />


      
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Delete Message?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You can delete this message for everyone or just for yourself.</p>
            
            <div className="flex flex-col gap-2">
              {(deleteTarget.sender?._id || deleteTarget.sender) === user._id && (
                <button 
                    onClick={() => confirmDelete('everyone')}
                    className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition shadow-lg"
                >
                    Delete for Everyone
                </button>
              )}
              
              <button 
                onClick={() => confirmDelete('me')}
                className="w-full py-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/60 transition"
              >
                Delete for Me
              </button>
              
              <button 
                onClick={() => setDeleteTarget(null)}
                className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, action: null, targetId: null, title: "", message: "" })}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.action === 'block' ? 'Block' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}
