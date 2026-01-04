import React, { useState } from 'react';

const PollModal = ({ isOpen, onClose, onSubmit }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  if (!isOpen) return null;

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim());
    if (question.trim() && validOptions.length >= 2) {
      onSubmit({ question, options: validOptions.map(text => ({ text })) });
      onClose();
      setQuestion("");
      setOptions(["", ""]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">Create Poll</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Question</label>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500 transition dark:text-white"
              placeholder="Ask something..."
              required
            />
          </div>

          <div className="space-y-3 mb-6">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  type="text" 
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500 transition dark:text-white"
                  placeholder={`Option ${i + 1}`}
                  required
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 rounded-xl transition">✕</button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button type="button" onClick={addOption} className="text-sm text-purple-600 dark:text-purple-400 font-bold hover:underline">+ Add Option</button>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition"
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollModal;
