'use strict';
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      const targetUrl = plan === 'pro' ? '/dashboard?onboarding=true&plan=pro' : '/dashboard?onboarding=true';
      router.push(targetUrl);
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.error || 'Error creating account');
  };

  return (
    <>
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-800 mb-2">
          Create Account
        </h1>
        <p className="text-sm font-medium text-indigo-600">Join Poultry Farm Management</p>
      </div>
      
      <form onSubmit={handleSignup} className="space-y-5">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 pr-12 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50 focus:bg-white"
              placeholder="Choose a secure password"
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
          {isSubmitting ? 'Creating Account…' : 'Sign Up'}
        </button>
        
        <div className="text-center mt-4">
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Already have an account? Login here
          </Link>
        </div>
      </form>
    </>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/5 p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] flex bg-white shadow-2xl shadow-indigo-950/10 rounded-3xl overflow-hidden border border-slate-200/80 min-h-[600px] md:min-h-[680px] lg:min-h-[740px]">
        {/* Left Side: Illustration */}
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
              Start Commercial Management
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-wide text-white">
              Initialize Your Poultry Farm
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 font-medium">
              Join thousands of commercial farm owners managing multi-section flocks, egg production, and financial accounting.
            </p>
          </div>
        </div>
        
        {/* Right Side: Signup Form */}
        <div className="w-full md:w-1/2 lg:w-[45%] p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between bg-white relative">
          <Suspense fallback={<div className="text-center p-8 text-slate-500 font-medium">Loading signup...</div>}>
            <SignupForm />
          </Suspense>
          
          <div className="pt-8 text-center text-xs text-slate-400 font-semibold border-t border-slate-100 mt-6">
            <p>&copy; 2026 Poultry Farm Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
