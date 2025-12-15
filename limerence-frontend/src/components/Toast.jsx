import React, { useState, useEffect } from 'react';

// Simple Event Bus for Toasts
const listeners = [];
export const toast = (message, type = 'success') => {
  listeners.forEach(l => l({ message, type, id: Date.now() }));
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (newToast) => {
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 3000);
    };
    listeners.push(handleToast);
    return () => {
        const index = listeners.indexOf(handleToast);
        if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-6 py-3 rounded-xl shadow-2xl text-white font-bold animate-slide-in-right ${
            t.type === 'error' ? 'bg-red-500' : 'bg-green-600'
        }`}>
            {t.message}
        </div>
      ))}
    </div>
  );
};
