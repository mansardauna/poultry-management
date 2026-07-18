'use client';

import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect if the app is already installed/running in standalone mode
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isAppStandalone);

    if (isAppStandalone) return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOSMobile = isIPad || isIPhone;
    const isSafari = isIOSMobile && webkit && !ua.match(/CriOS/i);

    if (isSafari) {
      setIsIOS(true);
      // Show iOS prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    }

    // Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show custom prompt after a few seconds so it isn't too aggressive
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white rounded-t-3xl rounded-b-xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border border-slate-100 p-5 relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-lg">Install PFMS App</h3>
            <p className="text-slate-500 text-sm leading-tight mt-0.5">
              Add to your home screen for faster access and offline mode!
            </p>
          </div>
        </div>

        <div className="mt-5">
          {isIOS ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 flex items-center gap-3">
              <span className="flex-1">
                To install, tap the <Share className="w-4 h-4 inline text-blue-500 mx-1 mb-1" /> icon below and select <strong>Add to Home Screen</strong> <PlusSquare className="w-4 h-4 inline text-slate-500 mx-1 mb-1" />
              </span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Install App Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
