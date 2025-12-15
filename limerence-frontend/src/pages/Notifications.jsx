import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
    const { token } = useContext(AuthContext);
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
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading notifications...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-20 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Notifications</h1>
                    <button onClick={handleClearAll} className="text-primary text-sm font-bold hover:underline">Mark all read</button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No notifications yet. Go make some friends!
                        </div>
                    ) : (
                        <ul>
                            {notifications.map((notif) => (
                                <li 
                                    key={notif._id} 
                                    className={`p-4 border-b last:border-b-0 flex items-start gap-4 transition hover:bg-gray-50 ${!notif.isRead ? 'bg-purple-50/50' : ''}`}
                                    onClick={() => markAsRead(notif._id)}
                                >
                                    <div className="text-2xl pt-1">
                                        {notif.type === 'friend_request' ? '👋' : 
                                         notif.type === 'friend_accept' ? '✅' : '📢'}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                            {notif.content}
                                        </p>
                                        <span className="text-xs text-gray-400 block mt-1">
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                        
                                        {/* Action buttons could go here if we want direct accept */}
                                        {notif.type === 'friend_request' && !notif.isRead && (
                                            <div className="mt-2">
                                                <button onClick={() => navigate('/profile')} className="text-xs bg-primary text-white px-3 py-1 rounded-full">
                                                    View Profile
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
