import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0); // Club messages
  const [unreadDMs, setUnreadDMs] = useState(0);

  const fetchUnreadNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/notifications", {
        headers: { "x-auth-token": token }
      });
      const unread = res.data.filter(n => !n.isRead).slice(0, 5);
      // Avoid state update if identical
      setUnreadNotifications(prev => {
        if (JSON.stringify(prev) === JSON.stringify(unread)) return prev;
        return unread;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadClubMessages = async () => {
    if (!token || !user) return;
    try {
      const res = await axios.get("/api/clubs", {
        headers: { "x-auth-token": token }
      });
      
      let totalUnread = 0;
      
      res.data.forEach(club => {
        // Use toString for reliable comparison
        const isMember = club.members?.some(m => {
          const memberId = (m._id || m).toString();
          return memberId === user._id.toString();
        });
        if (!isMember) return;
        
        if (club.messages?.length > 0) {
          // Use memberStats for proper unread tracking
          const stats = club.memberStats?.find(s => {
            const statsUserId = (s.user?._id || s.user).toString();
            return statsUserId === user._id.toString();
          });
          const lastRead = stats ? new Date(stats.lastReadAt).getTime() : 0;
          
          club.messages.forEach(m => {
            const senderId = (m.user?._id || m.user).toString();
            const isMe = senderId === user._id.toString();
            const msgTime = new Date(m.createdAt).getTime();
            if (!isMe && msgTime > lastRead) {
              totalUnread++;
            }
          });
        }
      });
      
      setUnreadMessages(prev => prev === Math.min(totalUnread, 99) ? prev : Math.min(totalUnread, 99));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadDMs = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/dm/unread/count", {
        headers: { "x-auth-token": token }
      });
      const count = res.data.count || 0;
      setUnreadDMs(prev => prev === count ? prev : count);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAllRules = () => {
    fetchUnreadNotifications();
    fetchUnreadClubMessages();
    fetchUnreadDMs();
  };

  // Poll every 30 seconds
  useEffect(() => {
    if (token) {
      refreshAllRules();
      const interval = setInterval(refreshAllRules, 30000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const value = React.useMemo(() => ({
    unreadNotifications,
    unreadMessages,
    unreadDMs,
    fetchUnreadNotifications,
    fetchUnreadClubMessages,
    fetchUnreadDMs,
    refreshAllRules
  }), [unreadNotifications, unreadMessages, unreadDMs]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
