'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  KeyRound, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SetupLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both owner username and master password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/setup/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        toast.success('Owner identity verified. Unlocking setup wizard...');
        router.push(data.redirect || '/setup');
        return;
      }

      setErrorMsg(data?.error || 'Invalid owner credentials or master password.');
      toast.error(data?.error || 'Access denied.');
    } catch (_err) {
      setErrorMsg('Unable to reach authentication server. Please check your connection.');
      toast.error('Connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between text-slate-800 p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="inline-flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">PFMS</span>
        </Link>
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={15} /> Return to Home
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white border border-slate-200/80 shadow-2xl shadow-indigo-950/10 rounded-3xl p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-lg shadow-indigo-600/25 mb-4">
            P
          </div>
          <div>
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full mb-3">
              System Owner Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Owner Master Setup
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
            Sign in with the master deployment credentials provided by the platform seller to unlock the setup wizard.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2.5 shadow-xs">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Owner Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. owner or owner@poultry.com"
              required
              className="w-full border-2 border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Master Deployment Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master deployment password"
                required
                className="w-full border-2 border-slate-200 rounded-xl p-3.5 pr-12 text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all bg-slate-50 focus:bg-white font-medium text-slate-900 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
              <KeyRound size={14} className="text-indigo-600" />
              <span>Software Buyer License Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Enter the deployment credentials supplied with your license (default username: <code className="text-slate-800 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">owner</code>). After verification and finishing setup, you will be authenticated directly into the SuperAdmin dashboard.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating Owner…</span>
            ) : (
              <>
                <span>Unlock Setup Wizard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 font-medium py-4">
        &copy; 2026 Poultry Farm Management System. Self-Hosted Master Deployment.
      </div>
    </div>
  );
}
