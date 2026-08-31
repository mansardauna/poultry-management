'use strict';
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function LandingNav({ activePath }: { activePath?: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(!!data.authenticated);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">P</div>
            <span className="font-bold text-xl tracking-tight text-slate-800">PFMS</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <Link href="/about" className={`hover:text-indigo-600 transition-colors ${activePath === '/about' ? 'text-indigo-600 font-semibold' : ''}`}>About</Link>
            <Link href="/pricing" className={`hover:text-indigo-600 transition-colors ${activePath === '/pricing' ? 'text-indigo-600 font-semibold' : ''}`}>Pricing</Link>
            <Link href="/documentation" className={`hover:text-indigo-600 transition-colors ${activePath === '/documentation' ? 'text-indigo-600 font-semibold' : ''}`}>Documentation</Link>
            <Link href="/contact" className={`hover:text-indigo-600 transition-colors ${activePath === '/contact' ? 'text-indigo-600 font-semibold' : ''}`}>Contact</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors hidden sm:block">
                  Log In
                </Link>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
