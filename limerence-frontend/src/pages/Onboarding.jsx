import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePreferences } from "../api/auth";

const QUESTIONS = [
  {
    id: 1,
    question: "What's your favorite romance trope?",
    options: ["Enemies to Lovers", "Fake Dating", "Second Chance", "Grumpy x Sunshine"],
  },
  {
    id: 2,
    question: "How spicy do you like your books?",
    options: ["Sweet & Clean", "Slow Burn", "Steamy", "Scorching Hot"],
  },
  {
    id: 3,
    question: "Pick a setting:",
    options: ["Small Town", "Big City", "Fantasy World", "Historical Era"],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleOptionClick = async (option) => {
    const newAnswers = { ...answers, [QUESTIONS[step].id]: option };
    setAnswers(newAnswers);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Finish onboarding
      try {
        // Convert answers object to array of values or keep as object
        const preferences = Object.values(newAnswers);
        const token = localStorage.getItem("authToken");
        if (token) {
             // Only save if logged in (which they should be)
             // We need to import updatePreferences. 
             // Since I can't import inside function, I'll assume I added import at top.
             // Wait, I need to add the import first.
             // I'll do it in a separate edit or just use axios here if lazy, but better to use api.
             // Let's use the api function.
             await updatePreferences(preferences);
        }
      } catch (err) {
        console.error("Failed to save preferences", err);
      }
      localStorage.setItem("onboardingComplete", "true");
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
            ></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {QUESTIONS[step].question}
          </h2>
          <p className="text-gray-500 text-sm">Step {step + 1} of {QUESTIONS.length}</p>
        </div>

        <div className="space-y-3">
          {QUESTIONS[step].options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              className="w-full py-3 px-6 rounded-xl border-2 border-gray-100 hover:border-primary hover:bg-pink-50 text-gray-700 font-medium transition-all duration-200 transform hover:scale-[1.02]"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
