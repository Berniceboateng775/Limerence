import React, { useState, useRef, useEffect } from 'react';

const CustomAudioPlayer = ({ src, dark = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const setAudioDuration = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const width = e.target.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const seekTime = (clickX / width) * duration;
    audioRef.current.currentTime = seekTime;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl min-w-[220px] select-none ${dark ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'} shadow-sm border ${dark ? 'border-slate-700' : 'border-gray-200'}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button 
        onClick={togglePlay}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition ${isPlaying ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-slate-600'}`}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div 
          className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] opacity-70 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <a href={src} download target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition" title="Download">
        ⬇
      </a>
    </div>
  );
};

export default CustomAudioPlayer;
