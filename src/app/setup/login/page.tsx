'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, Server, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col justify-between text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider">
          <ArrowLeft size={16} /> Return to Home
        </Link>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs text-amber-400 font-semibold">
          <KeyRound size={13} />
          <span>System Deployment Portal</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-slate-900/90 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 ring-4 ring-slate-800">
            <Server className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Owner Master Setup
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Enter your owner credentials to unlock the installation wizard and configure database drivers, payment keys, and mail pipelines.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">!</div>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Owner Username / Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. owner or owner@poultry.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master deployment password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <KeyRound size={13} />
              <span>Software Buyer / License Access</span>
            </div>
            <p>
              Use the master credentials given by the platform seller (default username: <code className="text-white font-mono font-bold bg-slate-800 px-1 py-0.5 rounded">owner</code>). After verification and completing setup, you will be taken directly into your master SuperAdmin dashboard.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-indigo-300 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
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
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 py-4">
        &copy; 2026 Poultry Farm Management System. Self-Hosted Master Deployment.
      </div>
    </div>
  );
}
