import React from 'react';

export const Logo = ({ className = "w-8 h-8", showText = true, textClassName = "text-xl font-serif font-bold tracking-tight" }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* Icon */}
      <div className={`${className} relative flex-shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" /> {/* Purple 600 */}
              <stop offset="100%" stopColor="#db2777" /> {/* Pink 600 */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Heart/Book Shape */}
          {/* Left Page (Left Heart Lobe) */}
          <path 
            d="M50 85 C50 85 10 65 10 35 C10 15 30 10 45 25 L50 30" 
            stroke="url(#logoGradient)" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Page (Right Heart Lobe) */}
          <path 
            d="M50 85 C50 85 90 65 90 35 C90 15 70 10 55 25 L50 30" 
            stroke="url(#logoGradient)" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Center Spine/Sparkle */}
          <circle cx="50" cy="20" r="4" fill="#db2777" className="animate-pulse" />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span className={`${textClassName} text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500`}>
          Limerence
        </span>
      )}
    </div>
  );
};

export default Logo;
