'use client';

import React, { useState, useEffect } from 'react';

export function Preloader() {
  const [activeRequests, setActiveRequests] = useState(0);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    // Override window.fetch
    window.fetch = async (...args) => {
      setActiveRequests((prev) => prev + 1);
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        setActiveRequests((prev) => Math.max(0, prev - 1));
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Manage progress bar animation
  useEffect(() => {
    if (activeRequests > 0) {
      setVisible(true);
      setProgress(10);
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Slowly increase to 90%
          return prev + (90 - prev) * 0.15;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400); // Wait for transition to complete
      return () => clearTimeout(timeout);
    }
  }, [activeRequests]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Premium glowing progress bar */}
      <div 
        className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.7)]"
        style={{ width: `${progress}%` }}
      />
      {/* Subtle micro spinner overlay */}
      <div className="fixed bottom-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-2 shadow-lg rounded-full flex items-center justify-center animate-fade-in pointer-events-none">
        <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  );
}
