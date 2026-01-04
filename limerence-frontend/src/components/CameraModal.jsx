import React, { useRef, useState, useEffect } from 'react';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo-${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
        onClose();
      }, 'image/png');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
      <div className="relative w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        <canvas ref={canvasRef} className="hidden" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition"
        >
          ✕
        </button>
      </div>

      <div className="mt-8 flex gap-8 items-center">
        <button 
          onClick={capturePhoto}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition group"
        >
          <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition" />
        </button>
      </div>
    </div>
  );
};

export default CameraModal;
