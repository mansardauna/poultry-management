'use strict';
'use client';

import { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
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
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent pointer-events-none" />
        </div>
        
        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white relative">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-sm font-medium text-indigo-600">Poultry Farm Management System</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-200 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
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
          
          <div className="text-center mt-6 relative z-10">
            <Link href="/signup" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer block p-2">
              Don't have an account? Sign up here
            </Link>
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            <p>&copy; 2026 Poultry Farms Management. All rights reserved.</p>
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
