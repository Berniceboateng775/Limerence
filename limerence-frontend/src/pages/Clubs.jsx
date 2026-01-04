import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NotificationContext } from "../context/NotificationContext";
import { toast } from "../components/Toast";
import EmojiPicker from "emoji-picker-react";
import ClubMessageBubble from "../components/ClubMessageBubble";
import CustomAudioPlayer from "../components/CustomAudioPlayer";
import AttachmentMenu from "../components/AttachmentMenu";
import CameraModal from "../components/CameraModal";
import PollModal from "../components/PollModal";

// Generate unique colors per USER (using userId for uniqueness)
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
  // Use uniqueId (userId) for hashing to ensure different users get different colors
  const hashStr = uniqueId || name || 'default';
  const hash = hashStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    name: nameColors[hash % nameColors.length],
    avatar: avatarColors[hash % avatarColors.length]
  };
};

export default function Clubs() {
  const { token, user } = useContext(AuthContext);
  const { theme } = useTheme();
  const { fetchUnreadClubMessages } = useContext(NotificationContext);

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

  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState('groups'); // 'groups' or 'friends'
  const [showJoinModal, setShowJoinModal] = useState(null); // club object to join
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  
  // Forms
  const [clubForm, setClubForm] = useState({ name: "", description: "", currentBook: "" });

  // Chat State
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // New UI States
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  // Refs
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});

  // Friends & Profile
  const [myFriends, setMyFriends] = useState([]);
  
  // UI State
  const [imagePreview, setImagePreview] = useState(null);
  const [fontSize, setFontSize] = useState("medium");

  const documentInputRef = useRef(null);

  // Per-club wallpaper settings
  const [clubWallpapers, setClubWallpapers] = useState(() => {
    const saved = localStorage.getItem("clubWallpapers");
    return saved ? JSON.parse(saved) : {};
  });
  const [clubCustomWallpapers, setClubCustomWallpapers] = useState(() => {
    const saved = localStorage.getItem("clubCustomWallpapers");
    return saved ? JSON.parse(saved) : {};
  });

  // Keep ref in sync with selectedClub
  useEffect(() => {
    // selectedClubIdRef.current = selectedClub?._id || null; // This ref is removed
  }, [selectedClub]);

  const fetchClubs = useCallback(async () => {
    try {
      const res = await axios.get("/api/clubs");
      setClubs(res.data);
      // Update selected club if it exists - use ref to avoid stale closure
      // const currentSelectedId = selectedClubIdRef.current; // This ref is removed
      // if (currentSelectedId) {
      //   const updated = res.data.find(c => c._id === currentSelectedId);
      //   if (updated) setSelectedClub(updated);
      // }
    } catch (err) { console.error(err); }
  }, []); // No dependencies needed - uses ref

  // Keep messageRef in sync
  useEffect(() => {
    // messageRef.current = message; // This ref is removed
  }, [message]);

  useEffect(() => {
    fetchClubs();
    // No interval - fetch only on initial load and specific actions to prevent flickering
  }, []);

  // Detect ?join= URL parameter for join popup
  useEffect(() => {
    if (!user?._id) return; // Wait for user to be loaded
    
    const urlParams = new URLSearchParams(window.location.search);
    const joinClubId = urlParams.get('join');
    
    if (joinClubId && clubs.length > 0) {
      const clubToJoin = clubs.find(c => c._id === joinClubId);
      if (clubToJoin) {
        const isMember = clubToJoin.members?.some(m => (m._id || m) === user._id);
        const isBanned = clubToJoin.bannedUsers?.some(b => (b._id || b) === user._id);
        
        if (!isMember && !isBanned) {
          setShowJoinModal(clubToJoin);
        } else if (isBanned) {
          toast("You are banned from this club", "error");
        } else {
          // Already a member, just select it
          setSelectedClub(clubToJoin);
        }
        // Clear the URL param
        window.history.replaceState({}, '', '/clubs');
      }
    }
  }, [clubs, user?._id]);
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
      fetchUnreadClubMessages(); // Update global badge
      fetchClubs(); // Update sidebar counts
    } catch (e) { console.error(e); }
  };

  // Fetch populated friends when invite or share modal opens
  useEffect(() => {
    if (showInviteModal || showShareModal) {
      const fetchFriends = async () => {
        try {
          const res = await axios.get("/api/users/me", { headers: { "x-auth-token": token } });
          setMyFriends(res.data.friends || []);
        } catch (err) {
          console.error("Failed to fetch friends:", err);
        }
      };
      fetchFriends();
    }
  }, [showInviteModal, showShareModal, token]);

  const calculateUnread = (club) => {
    const stats = club.memberStats?.find(s => s.user === user._id || s.user?._id === user._id);
    const lastRead = stats ? new Date(stats.lastReadAt).getTime() : 0;
    return club.messages.filter(m => {
      const senderId = m.user?._id || m.user;
      const isMe = senderId === user._id;
      return !isMe && new Date(m.createdAt).getTime() > lastRead;
    }).length;
  };

  // Fetch full user profile by ID
  const fetchUserProfile = async (userOrId) => {
    // If it's already a full user object with name, use it
    if (userOrId && typeof userOrId === 'object' && userOrId.name && userOrId.about !== undefined) {
      setViewProfile(userOrId);
      return;
    }
    
    const userId = typeof userOrId === 'string' ? userOrId : userOrId?._id || userOrId;
    if (!userId) return;
    
    setLoadingProfile(true);
    try {
      const res = await axios.get(`/api/users/${userId}`, { headers: { 'x-auth-token': token } });
      setViewProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Fallback: use what we have
      if (typeof userOrId === 'object') setViewProfile(userOrId);
    } finally {
      setLoadingProfile(false);
    }
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

  const cancelRecording = () => {
    setAudioBlob(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !attachment && !audioBlob) return;

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
      if (audioBlob) formData.append("attachment", audioBlob, "voice.webm");
      
      if (replyingTo) {
        // Map _id to id for backend schema compatibility
        formData.append("replyTo", JSON.stringify({
          id: replyingTo._id,
          username: replyingTo.username,
          content: replyingTo.content
        }));
      }

      const res = await axios.post(`/api/clubs/${selectedClub._id}/message`, formData, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
      });
      
      setAttachment(null);
      setAudioBlob(null);
      setReplyingTo(null);
      
      // Update with server response (messages array)
      setSelectedClub(prev => ({ ...prev, messages: res.data }));
      
      await markAsRead(selectedClub._id); // Await to ensure read state is updated before fetching
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
        const res = await axios.put(`/api/clubs/${selectedClub._id}`, formData, { 
          headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" } 
        });
        // Update selectedClub and viewProfile with new data
        setSelectedClub(res.data);
        if (viewProfile?._id === selectedClub._id) {
          setViewProfile(res.data);
        }
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
      console.error("Club operation failed:", err);
      toast(err.response?.data?.msg || "Operation failed", "error");
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
    } catch (err) { 
      // Show banned message if user is banned
      toast(err.response?.data?.msg || "Failed to join", "error"); 
    }
  };

  // Leave club - shows custom modal
  const handleLeaveClub = () => {
    if (!selectedClub) return;
    setConfirmModal({
      show: true,
      title: 'Leave Club',
      message: `Are you sure you want to leave "${selectedClub.name}"?`,
      onConfirm: async () => {
        try {
          await axios.post(`/api/clubs/${selectedClub._id}/leave`, {}, { headers: { "x-auth-token": token } });
          setSelectedClub(null);
          setViewProfile(null);
          fetchClubs();
          toast("You left the club", "success");
        } catch (err) { 
          console.error(err);
          toast("Failed to leave", "error"); 
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Delete club (admin only) - shows custom modal
  const handleDeleteClub = () => {
    if (!selectedClub) return;
    setConfirmModal({
      show: true,
      title: '⚠️ Delete Club',
      message: `Are you sure you want to DELETE "${selectedClub.name}"? This action cannot be undone!`,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/clubs/${selectedClub._id}`, { headers: { "x-auth-token": token } });
          setSelectedClub(null);
          setViewProfile(null);
          fetchClubs();
          toast("Club deleted", "success");
        } catch (err) { 
          console.error(err);
          toast(err.response?.data?.msg || "Failed to delete", "error"); 
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Kick member (admin only) - shows custom modal
  const handleKickMember = (memberId, memberName) => {
    if (!selectedClub) return;
    setConfirmModal({
      show: true,
      title: 'Remove Member',
      message: `Remove ${memberName} from the club?`,
      onConfirm: async () => {
        try {
          await axios.post(`/api/clubs/${selectedClub._id}/kick`, { userIdToKick: memberId }, { headers: { "x-auth-token": token } });
          // Fetch fresh club data
          const res = await axios.get("/api/clubs");
          setClubs(res.data);
          toast(`${memberName} removed`, "success");
          
          // Update viewProfile with fresh data if viewing club
          if (viewProfile?.members) {
            const updated = res.data.find(c => c._id === selectedClub._id);
            if (updated) {
              setViewProfile(updated);
              setSelectedClub(updated);
            }
          }
        } catch (err) { 
          console.error(err);
          toast("Failed to remove member", "error"); 
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Delete message (admin only) - shows custom modal
  // Delete message (Admin or Sender)
  const handleDeleteMessage = (msgId) => {
    if (!selectedClub) return;
    
    // Check if current user is admin OR sender
    const isAdmin = selectedClub.admins?.some(a => (a._id || a) === user._id);
    const msg = selectedClub.messages?.find(m => m._id === msgId);
    const isMe = msg && (msg.user?._id || msg.user) === user._id;

    if (!isAdmin && !isMe) {
      toast("You can only delete your own messages", "error");
      return;
    }
    
    setConfirmModal({
      show: true,
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/clubs/${selectedClub._id}/messages/${msgId}`, { headers: { "x-auth-token": token } });
          
          // Update local state immediately
          setSelectedClub(prev => ({
            ...prev,
            messages: prev.messages.filter(m => m._id !== msgId)
          }));
          
          fetchClubs();
          toast("Message deleted", "success");
        } catch (err) { 
          console.error(err);
          toast(err.response?.data?.msg || "Failed to delete message", "error"); 
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  /* Handlers for New Features */
  const handleAttachmentSelect = (type) => {
    setShowAttachmentMenu(false);
    if (type === 'image') fileInputRef.current?.click();
    if (type === 'file') documentInputRef.current?.click();
    if (type === 'camera') setCameraOpen(true);
    if (type === 'location') sendLocation();
    if (type === 'poll') setPollModalOpen(true);
  };

  const sendLocation = () => {
      if (!navigator.geolocation) {
          toast("Geolocation not supported", "error");
          return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setMessage(prev => prev + (prev ? "\n" : "") + `📍 My Location: ${mapLink}`);
      }, () => toast("Location access denied", "error"));
  };

  const handleDocumentSelect = (e) => {
      const file = e.target.files[0];
      if (file && selectedClub) {
          sendFile(file, 'file');
      }
  };

  const handleCameraCapture = (file) => {
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
  };

  const handlePollCreate = async (pollData) => {
      if (!selectedClub) return;
      try {
          const payload = {
              content: "📊 New Poll",
              username: user.name,
              poll: JSON.stringify(pollData)
          };
          const res = await axios.post(`/api/clubs/${selectedClub._id}/message`, payload, {
              headers: { "x-auth-token": token }
          });
          // Update message list
          setSelectedClub(prev => ({ ...prev, messages: res.data }));
          toast("Poll created!", "success");
      } catch (err) {
          toast("Failed to create poll", "error");
      }
  };

  const sendFile = async (file, type) => {
      const formData = new FormData();
      formData.append('attachment', file);
      formData.append('username', user.name);
      formData.append('content', message);
      if (replyingTo) {
          formData.append('replyTo', JSON.stringify({
             id: replyingTo._id,
             username: replyingTo.username,
             content: replyingTo.content
          }));
      }
      
      try {
          const res = await axios.post(`/api/clubs/${selectedClub._id}/message`, formData, {
              headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
          });
          
          setSelectedClub(prev => ({...prev, messages: res.data}));
          setMessage(""); setAttachment(null); setImagePreview(null);
          setReplyingTo(null);
          toast("Sent!", "success");
      } catch (err) {
          toast("Failed to send", "error");
      }
  };

  const handleFileSelect = (e) => { if (e.target.files[0]) setAttachment(e.target.files[0]); };

  const handleWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedClub) {
      try {
        const formData = new FormData();
        formData.append("wallpaper", file);
        
        const res = await axios.post("/api/users/upload-wallpaper", formData, {
            headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" }
        });
        
        const fullUrl = `http://localhost:5000${res.data.url}`;
        setClubCustomWallpapers(prev => ({ ...prev, [selectedClub._id]: fullUrl }));
        setClubWallpapers(prev => ({ ...prev, [selectedClub._id]: 'custom' }));
        toast("Wallpaper uploaded!", "success");
      } catch (err) {
        console.error("Wallpaper upload failed", err);
        toast("Failed to upload wallpaper (check console)", "error");
      }
    }
  };

  const setWallpaperForClub = (clubId, wallpaperId) => {
    setClubWallpapers(prev => ({ ...prev, [clubId]: wallpaperId }));
    if (wallpaperId !== 'custom') {
      setClubCustomWallpapers(prev => {
        const newCustom = { ...prev };
        delete newCustom[clubId];
        return newCustom;
      });
    }
  };

  const getCurrentWallpaper = () => {
    if (!selectedClub) return wallpapers.romantic;
    const wpId = clubWallpapers[selectedClub._id] || 'romantic';
    if (wpId === 'custom' && clubCustomWallpapers[selectedClub._id]) return null;
    return wallpapers[wpId] || wallpapers.romantic;
  };

  const getCustomWallpaperStyle = () => {
    if (!selectedClub) return {};
    const wpId = clubWallpapers[selectedClub._id];
    if (wpId === 'custom' && clubCustomWallpapers[selectedClub._id]) {
      return { backgroundImage: `url(${clubCustomWallpapers[selectedClub._id]})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return {};
  };

  // Memoize filteredClubs to prevent recalculation on every keystroke
  const filteredClubs = useMemo(() => {
    return clubs
      .filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by latest message time (most recent first)
        const aLastMsg = a.messages?.[a.messages.length - 1];
        const bLastMsg = b.messages?.[b.messages.length - 1];
        const aTime = aLastMsg ? new Date(aLastMsg.createdAt).getTime() : 0;
        const bTime = bLastMsg ? new Date(bLastMsg.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [clubs, searchQuery]); // Only recalculate when these change

  // Scroll to a specific message by ID
  const scrollToMessage = (msgId) => {
    if (!msgId) return;
    const ref = messageRefs.current[msgId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight effect
      ref.classList.add('ring-2', 'ring-purple-500');
      setTimeout(() => ref.classList.remove('ring-2', 'ring-purple-500'), 2000);
    }
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
            const isBanned = club.bannedUsers?.some(b => (b._id || b) === user._id);
            const lastMsg = club.messages?.[club.messages.length - 1];
            
            return (
              <div 
                key={club._id} 
                onClick={() => { 
                  if (isBanned) {
                    toast("You have been banned from this club", "error");
                    return;
                  }
                  if (isMember) { 
                    setSelectedClub(club); 
                    setViewProfile(null); // Close any open profile when switching clubs
                    markAsRead(club._id);
                  } else { 
                    handleJoin(club._id); 
                  }
                }}
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
                    {isMember && lastMsg 
                      ? `${lastMsg.username || 'Unknown'}: ${lastMsg.content?.substring(0, 25)}${lastMsg.content?.length > 25 ? '...' : ''}` 
                      : club.description}
                  </p>
                </div>
                
                {/* Badges */}
                <div className="flex flex-col items-end gap-1">
                  {isBanned && <span className="text-[10px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">Banned</span>}
                  {!isMember && !isBanned && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">Join</span>}
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
                  value={clubWallpapers[selectedClub._id] || 'romantic'} 
                  onChange={e => setWallpaperForClub(selectedClub._id, e.target.value)}
                >
                  <option value="romantic">🌸 Romantic</option>
                  <option value="ocean">🌊 Ocean</option>
                  <option value="sunset">🌅 Sunset</option>
                  <option value="forest">🌲 Forest</option>
                  <option value="galaxy">🌌 Galaxy</option>
                  <option value="midnight">🌙 Midnight</option>
                  <option value="lavender">💜 Lavender</option>
                  {clubCustomWallpapers[selectedClub._id] && <option value="custom">🖼️ Custom</option>}
                </select>
                
                {/* Custom Wallpaper Upload */}
                <label className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition" title="Upload Custom Wallpaper">
                  🖼️
                  <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
                </label>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-1 ${getCurrentWallpaper() || ''}`}
              style={getCustomWallpaperStyle()}
            >
              {selectedClub.messages?.map((msg, i) => {
                const firstUnreadIdx = getFirstUnreadIndex(selectedClub);
                const isFirstUnread = i === firstUnreadIdx && firstUnreadIdx > -1;
                return (
                  <ClubMessageBubble 
                    key={msg._id || i} 
                    msg={msg} 
                    isFirstUnread={isFirstUnread} 
                    user={user}
                    selectedClub={selectedClub}
                    fontSize={fontSize}
                    fontSizes={fontSizes}
                    clubs={clubs}
                    setShowJoinModal={setShowJoinModal}
                    scrollToMessage={scrollToMessage}
                    fetchUserProfile={fetchUserProfile}
                    setReplyingTo={setReplyingTo}
                    handleReaction={handleReaction}
                    setReactionTarget={setReactionTarget}
                    reactionTarget={reactionTarget}
                    handleDeleteMessage={handleDeleteMessage}
                    messageRefs={messageRefs}
                    firstUnreadRef={firstUnreadRef}
                    onUpdateMessages={(newMsgs) => setSelectedClub(prev => ({...prev, messages: newMsgs}))}
                  />
                );
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
                   {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                   ) : (
                      <span className="text-2xl">📎</span>
                   )}
                   <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Selected File</p>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300 truncate">{attachment.name}</p>
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

              <form onSubmit={handleSendMessage} className="flex gap-2 items-end relative">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-2xl hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition text-gray-400">
                   <span className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition">😊</span>
                </button>
                
                {/* Attachment Menu Trigger */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
                    className="p-3 text-xl hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition text-gray-400 hover:text-purple-600"
                  >
                    ➕
                  </button>
                  {showAttachmentMenu && (
                    <AttachmentMenu onSelect={handleAttachmentSelect} showPoll={true} />
                  )}
                </div>

                {/* Hidden Inputs */}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                <input type="file" ref={documentInputRef} className="hidden" onChange={handleDocumentSelect} />

                <button type="button" onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 text-xl rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-200 dark:ring-red-900' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-purple-600'}`}>
                  {isRecording ? '⏹️' : '🎙️'}
                </button>
                
                <textarea 
                  className={`flex-1 bg-gray-100 dark:bg-slate-700 border-none rounded-2xl p-3 outline-none resize-none ${fontSizes[fontSize]} max-h-32 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 dark:text-white dark:placeholder-gray-400 transition min-h-[48px]`}
                  placeholder={`Message #${selectedClub.name}`} 
                  rows="1"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                />
                
                {audioBlob ? (
                   <button 
                     type="button"
                     onClick={(e) => handleSendMessage({ preventDefault: () => {} })}
                     className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg hover:from-green-600 hover:to-emerald-600 transition w-12 h-12 flex items-center justify-center animate-scale-up"
                   >
                     ➤
                   </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={!message.trim() && !attachment}
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:from-purple-600 hover:to-pink-600 transition w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➤
                  </button>
                )}
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
                            {/* Admin Action Buttons - Grid Layout */}
              {viewProfile.admins?.some(a => (a._id || a) === user._id) && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={openEdit} className="text-xs bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-full font-bold transition whitespace-nowrap">
                    ✏️ Edit Club
                  </button>
                  <button onClick={() => setShowInviteModal(true)} className="text-xs bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900 text-green-600 dark:text-green-400 px-3 py-2 rounded-full font-bold transition whitespace-nowrap">
                    👥 Add Members
                  </button>
                  <button 
                    onClick={() => setShowShareModal(true)} 
                    className="text-xs bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-full font-bold transition whitespace-nowrap"
                  >
                    🔗 Share Link
                  </button>
                  <button onClick={handleDeleteClub} className="text-xs bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 text-red-600 dark:text-red-400 px-3 py-2 rounded-full font-bold transition whitespace-nowrap">
                    🗑️ Delete Club
                  </button>
                </div>
              )}

              {/* Non-admin member buttons */}
              {viewProfile.members?.some(m => (m._id || m) === user._id) && !viewProfile.admins?.some(a => (a._id || a) === user._id) && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button 
                    onClick={() => setShowShareModal(true)} 
                    className="text-xs bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full font-bold transition"
                  >
                    🔗 Share Link
                  </button>
                  <button onClick={handleLeaveClub} className="text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full font-bold transition">
                    🚪 Leave Club
                  </button>
                </div>
              )}

              <div className="mt-8 text-left">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Members ({viewProfile.members?.length})</h4>
                <div className="space-y-2">
                  {viewProfile.members?.map(m => {
                    const color = getNameColor(m.name, m._id); // Use member ID for unique colors
                    const isAdmin = viewProfile.admins?.some(a => (a._id || a) === m._id);
                    const isSelf = m._id === user._id;
                    const canKick = viewProfile.admins?.some(a => (a._id || a) === user._id) && !isSelf;
                    
                    return (
                      <div key={m._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition">
                        <div onClick={() => fetchUserProfile(m)} className={`w-10 h-10 rounded-full overflow-hidden ${color.avatar} flex items-center justify-center text-sm font-bold text-white shadow-sm cursor-pointer`}>
                          {m.avatar ? <img src={`http://localhost:5000${m.avatar}`} className="w-full h-full object-cover" alt="" /> : m.name[0]}
                        </div>
                        <div className="flex-1 cursor-pointer" onClick={() => fetchUserProfile(m)}>
                          <span className="text-sm text-gray-700 dark:text-gray-200 block font-medium">{m.name}</span>
                          {isAdmin && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                          )}
                        </div>
                        {canKick && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleKickMember(m._id, m.name); }}
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition"
                            title="Remove member"
                          >
                            ✕
                          </button>
                        )}
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
                    <img src={`http://localhost:5000${viewProfile.avatar}`} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">{viewProfile.name?.[0]}</span>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-4">{viewProfile.name}</h2>
              
              {/* About Status */}
              <p className="text-gray-500 dark:text-gray-400 italic text-sm mt-2 px-4">
                "{viewProfile.about || "Hey there! I'm using Limerence 📚"}"
              </p>
              
              {/* Friend Status / Add Friend Button */}
              {viewProfile._id !== user._id && (
                user.friends?.some(f => (f._id || f) === viewProfile._id) ? (
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                    <span>✓</span> Friends
                  </div>
                ) : viewProfile.friendRequests?.some(req => (req.from?._id || req.from) === user._id && req.status === 'pending') ? (
                  <div className="mt-4 inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-full text-sm font-bold">
                    <span>⏳</span> Request Sent
                  </div>
                ) : (
                  <button 
                    onClick={async () => {
                      try {
                        await axios.post(`/api/users/friend-request/${viewProfile._id}`, {}, { headers: { 'x-auth-token': token } });
                        toast(`Friend request sent to ${viewProfile.name}!`, 'success');
                        // Refresh viewProfile to show updated status
                        fetchUserProfile(viewProfile._id);
                      } catch (err) {
                        toast(err.response?.data?.msg || 'Failed to send request', 'error');
                      }
                    }}
                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:from-purple-600 hover:to-pink-600 transition flex items-center gap-2 mx-auto"
                  >
                    <span>👋</span> Add Friend
                  </button>
                )
              )}
              
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
                  {clubs.filter(c => c.members.some(m => (m._id || m) === viewProfile._id)).map(club => {
                    // Check if current user is banned from this club
                    const isBanned = club.bannedUsers?.some(b => (b._id || b) === user._id);
                    const isMember = club.members.some(m => (m._id || m) === user._id);
                    
                    return (
                      <div 
                        key={club._id} 
                        onClick={() => { 
                          if (isBanned) {
                            toast("You have been banned from this club", "error");
                            return;
                          }
                          if (!isMember) {
                            handleJoin(club._id);
                            setViewProfile(null);
                          } else {
                            setSelectedClub(club); 
                            setViewProfile(null); 
                          }
                        }}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                          {club.coverImage ? (
                            <img src={`http://localhost:5000${club.coverImage}`} className="w-full h-full object-cover" alt="" />
                          ) : club.name[0]}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{club.name}</span>
                        {isBanned && <span className="text-[9px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">Banned</span>}
                        {!isMember && !isBanned && <span className="text-[9px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold">Join</span>}
                      </div>
                    );
                  })}
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

      {/* Invite Members Modal */}
      {showInviteModal && selectedClub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Members to {selectedClub.name}</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select friends to add to your club</p>
            
            <div className="space-y-2">
              {myFriends?.length > 0 ? myFriends.map(friend => {
                const isMember = selectedClub.members?.some(m => (m._id || m) === friend._id);
                const isBanned = selectedClub.bannedUsers?.some(b => (b._id || b) === friend._id);
                
                return (
                  <div key={friend._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden">
                        {friend.avatar ? (
                          <img src={`http://localhost:5000${friend.avatar}`} className="w-full h-full object-cover" alt="" />
                        ) : friend.name?.[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{friend.name}</span>
                    </div>
                    {isMember ? (
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-bold">Member</span>
                    ) : isBanned ? (
                      <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-bold">Banned</span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.post(`/api/clubs/${selectedClub._id}/invite`, 
                              { userIdToInvite: friend._id }, 
                              { headers: { "x-auth-token": token } }
                            );
                            setSelectedClub(res.data);
                            if (viewProfile?._id === selectedClub._id) setViewProfile(res.data);
                            toast(`${friend.name} added to club!`, "success");
                            fetchClubs(); // Refresh clubs list
                          } catch (err) {
                            toast(err.response?.data?.msg || "Failed to add member", "error");
                          }
                        }}
                        className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full font-bold hover:bg-purple-200 dark:hover:bg-purple-900/60 transition"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                );
              }) : (
                <p className="text-center text-gray-400 dark:text-gray-500 py-4">You have no friends to invite</p>
              )}
            </div>
            
            <button 
              onClick={() => setShowInviteModal(false)}
              className="w-full mt-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Share Modal - To Groups or To Friends */}
      {showShareModal && selectedClub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Share {selectedClub.name}</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setShareTab('groups')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${shareTab === 'groups' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
              >
                💬 To Groups
              </button>
              <button 
                onClick={() => setShareTab('friends')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${shareTab === 'friends' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
              >
                👤 To Friends
              </button>
            </div>

            <div className="space-y-2">
              {shareTab === 'groups' ? (
                // Show clubs user is member of
                clubs.filter(c => c.members?.some(m => (m._id || m) === user._id) && c._id !== selectedClub._id).length > 0 ? 
                  clubs.filter(c => c.members?.some(m => (m._id || m) === user._id) && c._id !== selectedClub._id).map(club => (
                    <div key={club._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden">
                          {club.coverImage ? <img src={`http://localhost:5000${club.coverImage}`} className="w-full h-full object-cover" alt="" /> : club.name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{club.name}</span>
                      </div>
                      <button
                        onClick={async () => {
                          const shareUrl = `${window.location.origin}/clubs?join=${selectedClub._id}`;
                          const shareMsg = `Join my club ${selectedClub.name}! ${shareUrl}`;
                          try {
                            await axios.post(`/api/clubs/${club._id}/message`, 
                              { content: shareMsg }, 
                              { headers: { "x-auth-token": token } }
                            );
                            // Mark as read immediately so it doesn't count as unread
                            await markAsRead(club._id);
                            toast(`Shared to ${club.name}!`, "success");
                            setShowShareModal(false);
                            fetchClubs(); // Refresh to update message list
                          } catch (err) {
                            toast("Failed to share", "error");
                          }
                        }}
                        className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full font-bold hover:bg-purple-200 dark:hover:bg-purple-900/60 transition"
                      >
                        Share
                      </button>
                    </div>
                  ))
                : <p className="text-center text-gray-400 dark:text-gray-500 py-4">No other groups to share to</p>
              ) : (
                // Show friends to DM
                myFriends.length > 0 ? myFriends.map(friend => (
                  <div key={friend._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold overflow-hidden">
                        {friend.avatar ? <img src={`http://localhost:5000${friend.avatar}`} className="w-full h-full object-cover" alt="" /> : friend.name?.[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{friend.name}</span>
                    </div>
                    <button
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}/clubs?join=${selectedClub._id}`;
                        const shareMsg = `Join my club ${selectedClub.name}! ${shareUrl}`;
                        try {
                          await axios.post(`/api/dm/${friend._id}/message`, 
                            { content: shareMsg }, 
                            { headers: { "x-auth-token": token } }
                          );
                          toast(`Sent to ${friend.name}!`, "success");
                          setShowShareModal(false);
                        } catch (err) {
                          toast("Failed to send", "error");
                        }
                      }}
                      className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full font-bold hover:bg-purple-200 dark:hover:bg-purple-900/60 transition"
                    >
                      Send
                    </button>
                  </div>
                )) : <p className="text-center text-gray-400 dark:text-gray-500 py-4">No friends to share with</p>
              )}
            </div>
            
            {/* Copy Link Option */}
            <button 
              onClick={async () => {
                const shareUrl = `${window.location.origin}/clubs?join=${selectedClub._id}`;
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast("Link copied!", "success");
                } catch (err) {
                  toast("Link: " + shareUrl, "info");
                }
              }}
              className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition"
            >
              📋 Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Join Club Modal - When clicking shared link */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden mb-4">
              {showJoinModal.coverImage ? <img src={`http://localhost:5000${showJoinModal.coverImage}`} className="w-full h-full object-cover" alt="" /> : showJoinModal.name?.[0]}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{showJoinModal.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{showJoinModal.description}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{showJoinModal.members?.length} members</p>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowJoinModal(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await handleJoin(showJoinModal._id);
                  setShowJoinModal(null);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition"
              >
                Join Club
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{confirmModal.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-600 transition shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CameraModal 
         isOpen={cameraOpen} 
         onClose={() => setCameraOpen(false)}
         onCapture={handleCameraCapture}
      />
      
      <PollModal 
         isOpen={pollModalOpen} 
         onClose={() => setPollModalOpen(false)}
         onSubmit={handlePollCreate} 
      />

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
