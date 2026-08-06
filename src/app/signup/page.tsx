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
    if (document.cookie.includes('pfms_workspace') || document.cookie.includes('pfms_org_id')) {
      router.push('/dashboard');
    }
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
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent pointer-events-none" />
        </div>
        
        {/* Right Side: Signup Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white relative">
          <Suspense fallback={<div className="text-center p-8 text-slate-500">Loading signup...</div>}>
            <SignupForm />
          </Suspense>
          
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            <p>&copy; 2026 Poultry Farms. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
