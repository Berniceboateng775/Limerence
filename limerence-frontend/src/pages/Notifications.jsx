import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationContext } from "../context/NotificationContext";

export default function Notifications() {
    const { token } = useContext(AuthContext);
    const { fetchUnreadNotifications } = useContext(NotificationContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) return;

        const fetchNotifications = async () => {
            try {
                const res = await axios.get("/api/notifications", {
                    headers: { 'x-auth-token': token }
                });
                setNotifications(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [token]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { 'x-auth-token': token }
            });
            // Update UI locally
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            // Update global badge
            fetchUnreadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearAll = async () => {
        try {
            await axios.put("/api/notifications/read-all", {}, {
                headers: { 'x-auth-token': token }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            // Update global badge
            fetchUnreadNotifications();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) return <div className="p-8 text-center dark:text-gray-400 dark:bg-slate-900 min-h-screen">Loading notifications...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-20 px-4 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Notifications</h1>
                    <button onClick={handleClearAll} className="text-primary text-sm font-bold hover:underline">Mark all read</button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No notifications yet. Go make some friends!
                        </div>
                    ) : (
                        <ul>
                            {notifications.map((notif) => (
                                <li 
                                    key={notif._id} 
                                    className={`p-4 border-b border-gray-100 dark:border-slate-700 last:border-b-0 flex items-start gap-4 transition hover:bg-gray-50 dark:hover:bg-slate-700 ${!notif.isRead ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
                                    onClick={() => markAsRead(notif._id)}
                                >
                                    <div className="text-2xl pt-1">
                                        {notif.type === 'friend_request' ? '👋' : 
                                         notif.type === 'friend_accept' ? '✅' : '📢'}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {notif.content}
                                        </p>
                                        <span className="text-xs text-gray-400 block mt-1">
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                        
                                        {/* Accept/Reject Friend Request */}
                                        {notif.type === 'friend_request' && !notif.isRead && notif.sender && (
                                            <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post('/api/users/friend-response', 
                                                                { requesterId: notif.sender._id || notif.sender, action: 'accept' },
                                                                { headers: { 'x-auth-token': token } }
                                                            );
                                                            markAsRead(notif._id);
                                                            // Show success feedback
                                                            setNotifications(prev => prev.map(n => 
                                                                n._id === notif._id ? { ...n, isRead: true, content: '✅ Friend request accepted!' } : n
                                                            ));
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }} 
                                                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-bold transition"
                                                >
                                                    ✓ Accept
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            await axios.post('/api/users/friend-response', 
                                                                { requesterId: notif.sender._id || notif.sender, action: 'reject' },
                                                                { headers: { 'x-auth-token': token } }
                                                            );
                                                            markAsRead(notif._id);
                                                            setNotifications(prev => prev.map(n => 
                                                                n._id === notif._id ? { ...n, isRead: true, content: 'Friend request declined' } : n
                                                            ));
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }} 
                                                    className="text-xs bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-bold transition"
                                                >
                                                    ✗ Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {!notif.isRead && (
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
