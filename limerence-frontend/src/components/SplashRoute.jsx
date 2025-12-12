import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashRoute({ children }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return showSplash ? <SplashScreen /> : children;
}
