import React from 'react';

const AttachmentMenu = ({ onSelect, showPoll = false }) => {
  const options = [
    { id: 'image', label: 'Gallery', icon: '🖼️', color: 'bg-green-100 text-green-600' },
    { id: 'camera', label: 'Camera', icon: '📷', color: 'bg-blue-100 text-blue-600' },
    { id: 'file', label: 'Document', icon: '📄', color: 'bg-purple-100 text-purple-600' },
    { id: 'location', label: 'Location', icon: '📍', color: 'bg-red-100 text-red-600' },
  ];

  if (showPoll) {
    options.push({ id: 'poll', label: 'Poll', icon: '📊', color: 'bg-orange-100 text-orange-600' });
  }

  return (
    <div className="absolute bottom-16 left-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 w-64 border border-gray-100 dark:border-slate-700 animate-scale-up origin-bottom-left z-50">
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition group"
          >
            <div className={`w-10 h-10 ${opt.color} rounded-full flex items-center justify-center text-xl transition transform group-hover:scale-110`}>
              {opt.icon}
            </div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AttachmentMenu;
