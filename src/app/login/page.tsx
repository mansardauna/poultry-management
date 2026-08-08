'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, X, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  // Forgot Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      router.push('/dashboard');
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.error || 'Invalid email or password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetStatus('submitting');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword })
      });

      const data = await res.json();
      setResetStatus('success');
      setResetMsg(data.message || 'Password reset instructions have been dispatched!');
    } catch (_err) {
      setResetStatus('idle');
      setResetMsg('Failed to process password reset. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/5 p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] flex bg-white shadow-2xl shadow-indigo-950/10 rounded-3xl overflow-hidden border border-slate-200/80 min-h-[600px] md:min-h-[680px] lg:min-h-[740px]">
        {/* Left Side: Rich Hero Illustration */}
        <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative bg-slate-950 border-r border-slate-100 items-center justify-center overflow-hidden">
          <Image 
            src="/login_illustration.png" 
            alt="Poultry Farm Management System" 
            fill 
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-10 left-10 right-10 text-white z-10 space-y-2 backdrop-blur-md bg-slate-950/40 p-6 rounded-2xl border border-white/10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-500/30">
              Commercial Farm Operations
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-wide text-white">
              Poultry Farm Management
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 font-medium">
              Multi-branch analytics, flock tracking, egg production logs, and automated feed threshold alerts.
            </p>
          </div>
        </div>
        
        {/* Right Side: Wider Login Form */}
        <div className="w-full md:w-1/2 lg:w-[45%] p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between bg-white relative">
          <div>
            <div className="mb-10 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Enterprise Control Portal</span>
              <h1 className="text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-slate-900 mt-1 mb-2">
                Welcome Back
              </h1>
              <p className="text-sm font-medium text-slate-500">Sign in to manage your farm branches & operations.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-200 font-semibold shadow-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">Email Address or Username</label>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 text-base focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all bg-slate-50 focus:bg-white font-medium"
                    placeholder="e.g. owner@poultry.com or username"
                    required
                  />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">Password</label>
                    <Link
                      href={email ? `/reset-password?email=${encodeURIComponent(email)}` : '/reset-password'}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 pr-14 text-base focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all bg-slate-50 focus:bg-white font-medium"
                    placeholder="Enter your password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[42px] text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-4 mt-4 rounded-xl uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:active:scale-100 shadow-xl shadow-indigo-600/25 cursor-pointer"
              >
                {isSubmitting ? 'Authenticating…' : 'Secure Login'}
              </button>
            </form>
            
            <div className="text-center mt-8">
              <Link href="/signup" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer inline-block p-2">
                Don't have an account? Sign up here &rarr;
              </Link>
            </div>
          </div>

          <div className="pt-8 text-center text-xs text-slate-400 font-semibold border-t border-slate-100 mt-6">
            <p>&copy; 2026 Poultry Farm Management System. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Reset Modal */}
      <Dialog open={showResetModal} onClose={() => setShowResetModal(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <KeyRound size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Reset Your Password</h3>
            </div>
            <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {resetStatus === 'success' ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl text-center space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
              <h4 className="font-bold text-sm">Reset Link Dispatched!</h4>
              <p className="text-xs text-emerald-700 leading-relaxed">{resetMsg}</p>
              <button
                onClick={() => setShowResetModal(false)}
                className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors w-full"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your account email below. We'll send instructions and let you specify a new password.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Account Email *</label>
                <input 
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. owner@poultry.com"
                  className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">New Password (Optional)</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetStatus === 'submitting'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm disabled:bg-indigo-300"
                >
                  {resetStatus === 'submitting' ? 'Processing…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
