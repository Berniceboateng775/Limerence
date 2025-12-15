import React from 'react';

const BadgeModal = ({ badge, onClose }) => {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-100 to-white -z-10"></div>
        
        <div className="text-6xl mb-4 animate-bounce-slow">
          {badge.icon || "🏆"}
        </div>
        
        <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">Congratulations!</h2>
        <p className="text-gray-500 mb-6">You've earned a new badge!</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <h3 className="text-xl font-bold text-yellow-800">{badge.name}</h3>
          <p className="text-yellow-600 text-sm">{badge.description}</p>
        </div>
        
        <button 
          onClick={onClose}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

export default BadgeModal;
