'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/features/LanguageContext';
import { useWhiteLabel } from '@/components/features/WhiteLabelContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export default function LoginPage() {
  const { t } = useLanguage();
  const whiteLabel = useWhiteLabel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA Challenge State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const router = useRouter();

  useEffect(() => {
    // Check existing auth
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          if (data.role === 'SuperAdmin' || data.user?.role === 'SuperAdmin') {
            router.push('/dashboard/admin');
          } else {
            router.push('/dashboard');
          }
        }
      })
      .catch(() => {});

    // Restore remembered email
    if (typeof window !== 'undefined') {
      const isRemembered = localStorage.getItem('pfms_remember_me') === 'true';
      const savedEmail = localStorage.getItem('pfms_saved_email');
      if (isRemembered && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = { rememberMe };
      if (requires2FA) {
        payload.tempToken = tempToken;
        payload.twoFactorCode = twoFactorCode.trim();
      } else {
        payload.email = email.trim();
        payload.password = password;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setIsSubmitting(false);
      const body = await response.json().catch(() => null);

      if (response.ok && body?.ok) {
        // Handle Remember Me persistence
        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('pfms_remember_me', 'true');
            localStorage.setItem('pfms_saved_email', email.trim());
          } else {
            localStorage.removeItem('pfms_remember_me');
            localStorage.removeItem('pfms_saved_email');
          }
        }

        const isSuper = body?.role === 'SuperAdmin';
        window.location.href = isSuper ? '/dashboard/admin' : '/dashboard';
        return;
      }

      // Check if 2FA code is needed
      if (body?.requires2FA) {
        setRequires2FA(true);
        setTempToken(body.tempToken || '');
        setError('');
        return;
      }

      const displayError = body?.error || `Authentication failed (HTTP ${response.status}). Check your email/password.`;
      setError(displayError);
    } catch (err) {
      setIsSubmitting(false);
      setError((err as { message?: string })?.message || 'Network connection failed while attempting to reach backend server.');
    }
  };

  const hasLoginError = Boolean(error);

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
              {t("Commercial Farm Operations")}
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-wide text-white">
              {t("Poultry Farm Management")}
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 font-medium">
              {t("Multi-branch analytics, flock tracking, egg production logs, and automated feed threshold alerts.")}
            </p>
          </div>
        </div>
        
        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 lg:w-[45%] p-6 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-between bg-white relative">
          {/* Top-Right Language Switcher */}
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10">
            <LanguageSelector variant="light" />
          </div>

          <div>
            <div className="mb-6 sm:mb-8 pr-16 sm:pr-0">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={whiteLabel.logoUrl || '/icon.png'} 
                  alt={whiteLabel.brandName} 
                  className="h-9 w-auto max-w-[140px] sm:max-w-[180px] object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.src.endsWith('/icon.png')) target.src = '/icon.png';
                  }}
                />
                <span className="font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight">
                  {whiteLabel.brandName}
                </span>
              </Link>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                {requires2FA ? t("Two-Factor Verification", "Two-Factor Verification") : t("Welcome back")}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                {requires2FA
                  ? t("Enter the 6-digit security code from your authenticator app to complete sign in.", "Enter the 6-digit security code from your authenticator app to complete sign in.")
                  : t("Sign in to manage your farm branches and operations.")}
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-200 font-semibold shadow-sm flex items-center justify-center gap-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {requires2FA ? (
                /* 2FA Challenge View */
                <div className="space-y-5">
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">{t("Two-Factor Protected", "Two-Factor Protected")}</h4>
                      <p className="text-xs text-indigo-700 font-medium">{t("Authenticator verification required for this account.", "Authenticator verification required for this account.")}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("6-Digit Authentication Code *", "6-Digit Authentication Code *")}</label>
                    <input 
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => {
                        setTwoFactorCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                        if (error) setError('');
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className={`w-full border-2 rounded-xl p-3.5 text-center text-3xl font-mono font-bold tracking-widest focus:outline-none focus:ring-0 shadow-none transition-colors ${
                        hasLoginError
                          ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                          : 'border-slate-200 bg-white focus:border-indigo-600'
                      }`}
                      required
                      autoFocus
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || twoFactorCode.length < 6}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-4 mt-2 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:active:scale-100 shadow-xl shadow-indigo-600/25 cursor-pointer"
                  >
                    {isSubmitting ? t('Verifying…', 'Verifying…') : t('Verify & Sign In', 'Verify & Sign In')}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setTwoFactorCode('');
                        setError('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} /> {t("Back to Password Entry", "Back to Password Entry")}
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Credentials View */
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("Email address")}</label>
                      <input 
                        type="text" 
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        className={`w-full border-2 rounded-xl p-3.5 text-sm sm:text-base font-medium transition-colors focus:outline-none focus:ring-0 shadow-none ${
                          hasLoginError
                            ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600'
                        }`}
                        placeholder="e.g. user@example.com or username"
                        required
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("Password")}</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError('');
                          }}
                          className={`w-full border-2 rounded-xl p-3.5 pr-12 text-sm sm:text-base font-medium transition-colors focus:outline-none focus:ring-0 shadow-none ${
                            hasLoginError
                              ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                              : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600'
                          }`}
                          placeholder={t("Enter your password")}
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me Checkbox & Forgot Password Link */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                        <input 
                          type="checkbox" 
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        />
                        <span className="font-medium text-slate-700">{t("Remember me", "Remember me")}</span>
                      </label>
                      <Link
                        href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        {t("Forgot password?")}
                      </Link>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-4 mt-2 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:active:scale-100 shadow-xl shadow-indigo-600/25 cursor-pointer"
                  >
                    {isSubmitting ? t('Authenticating…') : t('Sign in')}
                  </button>
                </>
              )}
            </form>
            
            <div className="text-center mt-6">
              <Link href="/signup" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer inline-block p-2">
                {t("Don't have an account? Sign up here →")}
              </Link>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-slate-400 font-semibold border-t border-slate-100 mt-6">
            <p>&copy; 2026 Poultry Farm Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
