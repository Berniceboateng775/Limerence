import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from './Toast';

const ForwardModal = ({ message, onClose, onForward }) => {
    const { token, user } = useContext(AuthContext);
    const [targets, setTargets] = useState([]); // { type: 'friend'|'club', id, name, avatar }
    const [selectedTargets, setSelectedTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [friendsRes, clubsRes] = await Promise.all([
                    axios.get("/api/users/friends", { headers: { "x-auth-token": token } }),
                    axios.get("/api/clubs", { headers: { "x-auth-token": token } })
                ]);

                const friendTargets = friendsRes.data.map(f => ({
                    type: 'friend',
                    id: f._id,
                    name: f.name,
                    avatar: f.avatar,
                    description: "Friend"
                }));
                // Only show clubs where user is a member
                const myClubs = clubsRes.data.filter(c => 
                    c.members?.some(m => (m._id || m) === (user?._id || user?.id))
                );
                const clubTargets = myClubs.map(c => ({
                    type: 'club',
                    id: c._id,
                    name: c.name,
                    avatar: c.coverImage,
                    description: "Club"
                }));

                setTargets([...friendTargets, ...clubTargets]);
            } catch (err) {
                console.error(err);
                toast("Failed to load contacts", "error");
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchData();
    }, [token]);

    const toggleSelection = (target) => {
        setSelectedTargets(prev => {
            const exists = prev.find(t => t.id === target.id && t.type === target.type);
            if (exists) return prev.filter(t => !(t.id === target.id && t.type === target.type));
            return [...prev, target];
        });
    };

    const handleSend = async () => {
        if (selectedTargets.length === 0) return;
        setSending(true);
        try {
            // Construct forwarded payload
            const forwardedData = {
                content: message.content,
                attachment: message.attachment, // Forward attachment if any
                attachmentType: (message.attachmentType && message.attachmentType !== 'none') 
                    ? message.attachmentType 
                    : (message.attachment?.fileType || 'none'), // Fallback to nested fileType
                isForwarded: true,
                forwardedFrom: {
                    userId: message.user?._id || message.user || message.sender?._id || message.sender, // Handle various structures
                    username: message.username || message.sender?.name || "Unknown",
                    originalMsgId: message._id
                }
            };

            const promises = selectedTargets.map(target => {
                if (target.type === 'friend') {
                    return axios.post(`/api/dm/${target.id}/message`, forwardedData, { headers: { "x-auth-token": token } });
                } else {
                    return axios.post(`/api/clubs/${target.id}/message`, forwardedData, { headers: { "x-auth-token": token } });
                }
            });

            await Promise.all(promises);

            toast(`Forwarded to ${selectedTargets.length} recipient(s)!`, "success");
            onForward && onForward();
            onClose();
        } catch (err) {
            console.error(err);
            toast("Failed to forward", "error");
        } finally {
            setSending(false);
        }
    };

    const filteredTargets = targets.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-4 shadow-2xl border dark:border-slate-700 h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">Forward Message</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">✕</button>
                </div>

                <input 
                    type="text" 
                    placeholder="Search people or clubs..." 
                    className="w-full bg-gray-100 dark:bg-slate-700 p-2 rounded-xl mb-4 outline-none dark:text-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                />

                <div className="flex-1 overflow-y-auto space-y-2">
                    {loading ? <div className="text-center p-4">Loading...</div> : filteredTargets.map(target => {
                        const isSelected = selectedTargets.some(t => t.id === target.id && t.type === target.type);
                        return (
                        <div 
                            key={`${target.type}-${target.id}`}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${isSelected ? 'bg-purple-100 dark:bg-purple-900/30 ring-1 ring-purple-500' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                            onClick={() => toggleSelection(target)}
                        >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>

                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden flex-shrink-0">
                                {target.avatar ? (
                                    <img src={`http://localhost:5000${target.avatar}`} className="w-full h-full object-cover" />
                                ) : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{target.name[0]}</div>}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm dark:text-white">{target.name}</h4>
                                <p className="text-xs text-gray-500">{target.description}</p>
                            </div>
                        </div>
                    )})}
                </div>

                <div className="mt-4 pt-2 border-t dark:border-slate-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
                    <button 
                        onClick={handleSend}
                        disabled={selectedTargets.length === 0 || sending} 
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? "Sending..." : `Send (${selectedTargets.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
