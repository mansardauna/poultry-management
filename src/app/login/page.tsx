'use strict';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

/** Exported function default */
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      router.push('/dashboard');
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.error || 'Invalid username or password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-4xl flex bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 min-h-[500px]">
        {/* Left Side: Illustration */}
        <div className="hidden md:flex md:w-1/2 relative bg-indigo-50 border-r border-slate-100 items-center justify-center">
          <Image 
            src="/login_illustration.png" 
            alt="Peaceful Poultry Farm Illustration" 
            fill 
            className="object-cover"
            priority
          />
          {/* Overlay gradient to make it pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent pointer-events-none" />
        </div>
        
        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white relative">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-sm font-medium text-indigo-600">Gaa Saka Poultry Farm Management</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-200 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg p-3 pr-12 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-indigo-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white font-bold text-sm py-3.5 mt-2 rounded-lg uppercase tracking-wider hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:active:scale-100 shadow-md shadow-indigo-200"
            >
              {isSubmitting ? 'Authenticating…' : 'Secure Login'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            <p>&copy; 2026 Gaa Saka Farms. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
