'use strict';
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLanguage } from '@/components/features/LanguageContext';
import { useWhiteLabel } from '@/components/features/WhiteLabelContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { t } = useLanguage();
  const whiteLabel = useWhiteLabel();

  // Current step: 1 = Email, 2 = Token, 3 = Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());
  const showEmailError = email.trim().length > 0 && !isEmailValid;

  // Password comparison & strength validation
  const isPasswordLengthValid = newPassword.length >= 6;
  const isPasswordMatch = newPassword === confirmPassword;
  const showPasswordMismatch = confirmPassword.length > 0 && !isPasswordMatch;
  const showPasswordMatchSuccess = confirmPassword.length > 0 && isPasswordMatch && isPasswordLengthValid;

  // Step 1: Request Token
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isEmailValid) {
      toast.error(t('Please enter a valid email address', 'Please enter a valid email address'));
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(t('Sending verification code…', 'Sending verification code…'));

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_token', email: email.trim() }),
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (res.ok) {
        toast.success(data.message || t('Verification code sent!', 'Verification code sent!'));
        setStep(2);
      } else {
        toast.error(data.error || t('Failed to send verification code', 'Failed to send verification code'));
      }
    } catch (_e) {
      toast.dismiss(toastId);
      toast.error(t('Network error while requesting verification code', 'Network error while requesting verification code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Token
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error(t('Please enter the 6-digit verification code', 'Please enter the 6-digit verification code'));
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(t('Verifying code…', 'Verifying code…'));

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_token', email: email.trim(), token: token.trim() }),
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (res.ok) {
        toast.success(t('Code verified! Set your new password.', 'Code verified! Set your new password.'));
        setStep(3);
      } else {
        toast.error(data.error || t('Invalid or expired verification code', 'Invalid or expired verification code'));
      }
    } catch (_e) {
      toast.dismiss(toastId);
      toast.error(t('Network error while verifying code', 'Network error while verifying code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Token
  const handleResendToken = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading(t('Resending verification code…', 'Resending verification code…'));

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_token', email: email.trim() }),
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (res.ok) {
        toast.success(t('A new code has been sent!', 'A new code has been sent!'));
      } else {
        toast.error(data.error || t('Failed to resend code', 'Failed to resend code'));
      }
    } catch (_e) {
      toast.dismiss(toastId);
      toast.error(t('Network error while resending code', 'Network error while resending code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Confirm Reset with New Password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error(t('Password must be at least 6 characters'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('Passwords do not match'));
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(t('Updating password…', 'Updating password…'));

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_reset',
          email: email.trim(),
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (res.ok) {
        setIsSuccess(true);
        toast.success(t('Password updated successfully!'));
      } else {
        toast.error(data?.error || t('Failed to reset password'));
      }
    } catch (_e) {
      toast.dismiss(toastId);
      toast.error(t('An error occurred. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg lg:max-w-xl bg-white shadow-2xl shadow-indigo-950/10 rounded-3xl overflow-hidden border border-slate-200/80 p-6 sm:p-10 lg:p-12 space-y-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageSelector variant="light" />
      </div>

      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={whiteLabel.logoUrl || '/icon.png'} 
            alt={whiteLabel.brandName} 
            className="h-10 w-auto max-w-[140px] sm:max-w-[180px] object-contain transition-transform group-hover:scale-105 mx-auto"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.endsWith('/icon.png')) target.src = '/icon.png';
            }}
          />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {t("Reset Your Password")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {step === 1 && t("Enter your account email to receive a recovery code.", "Enter your account email to receive a recovery code.")}
          {step === 2 && t("Enter the 6-digit verification code sent to your email.", "Enter the 6-digit verification code sent to your email.")}
          {step === 3 && t("Specify and confirm your new account password below.", "Specify and confirm your new account password below.")}
        </p>
      </div>

      {/* 3-Step Flow Indicator */}
      {!isSuccess && (
        <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 border-y border-slate-100">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              1
            </span>
            <span>{t("Email", "Email")}</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </span>
            <span>{t("Verification", "Verification")}</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${step === 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </span>
            <span>{t("New Password", "New Password")}</span>
          </div>
        </div>
      )}

      {isSuccess ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-3">
          <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
          <h3 className="text-lg font-bold text-emerald-900">{t("Password Reset Complete!", "Password Reset Complete!")}</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            {t("Your password has been updated. You can now log in to your account with your new password.", "Your password has been updated. You can now log in to your account with your new password.")}
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              {t("Proceed to Login", "Proceed to Login")}
            </button>
          </div>
        </div>
      ) : step === 1 ? (
        /* STEP 1: COLLECT EMAIL */
        <form onSubmit={handleRequestToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("Account email *")}</label>
            <div className="relative">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. owner@poultry.com"
                className={`w-full border-2 rounded-xl p-3.5 pl-10 text-sm sm:text-base font-medium transition-all focus:outline-none ${
                  showEmailError
                    ? 'border-red-500 ring-2 ring-red-500/50 bg-red-50/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-400 focus:bg-amber-50/20'
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/30'
                }`}
                required
              />
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {showEmailError && (
              <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{t("Please enter a valid email address", "Please enter a valid email address")}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !isEmailValid}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-4 mt-2 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:active:scale-100 shadow-xl shadow-indigo-600/25 cursor-pointer"
          >
            {isSubmitting ? t('Sending verification code…', 'Sending verification code…') : t('Send Verification Code', 'Send Verification Code')}
          </button>

          <div className="pt-2 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={14} /> {t("Back to Login")}
            </Link>
          </div>
        </form>
      ) : step === 2 ? (
        /* STEP 2: ENTER VERIFICATION CODE / TOKEN */
        <form onSubmit={handleVerifyToken} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 text-center">
            {t("Code sent to", "Code sent to")}: <strong className="text-slate-900">{email}</strong>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("6-Digit Verification Code *", "6-Digit Verification Code *")}</label>
            <input 
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full border-2 border-slate-200 rounded-xl p-3.5 text-center text-3xl font-mono font-bold tracking-widest focus:outline-none transition-all bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/30"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || token.length < 6}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:active:scale-100 shadow-xl shadow-indigo-600/25 cursor-pointer"
          >
            {isSubmitting ? t('Verifying code…', 'Verifying code…') : t('Verify Code & Proceed', 'Verify Code & Proceed')}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <ArrowLeft size={14} /> {t("Change Email", "Change Email")}
            </button>

            <button
              type="button"
              onClick={handleResendToken}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer disabled:text-slate-400"
            >
              <RefreshCw size={14} /> {t("Resend Code", "Resend Code")}
            </button>
          </div>
        </form>
      ) : (
        /* STEP 3: SET & CONFIRM NEW PASSWORD */
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("New password *", "New password *")}</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("Minimum 6 characters", "Minimum 6 characters")}
                className={`w-full border-2 rounded-xl p-3.5 pr-12 text-sm sm:text-base font-medium transition-all focus:outline-none ${
                  newPassword.length > 0 && newPassword.length < 6
                    ? 'border-red-500 ring-2 ring-red-500/50 bg-red-50/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-400 focus:bg-amber-50/20'
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/30'
                }`}
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
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{t("Password must be at least 6 characters", "Password must be at least 6 characters")}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("Confirm new password *", "Confirm new password *")}</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("Re-enter new password", "Re-enter new password")}
                className={`w-full border-2 rounded-xl p-3.5 pr-12 text-sm sm:text-base font-medium transition-all focus:outline-none ${
                  showPasswordMismatch
                    ? 'border-red-500 ring-2 ring-red-500/50 bg-red-50/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-400 focus:bg-amber-50/20'
                    : showPasswordMatchSuccess
                    ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-50/20 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/40 focus:bg-white'
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/30'
                }`}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer flex items-center justify-center"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Real-time comparison feedback below input */}
            {showPasswordMismatch && (
              <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{t("Passwords do not match", "Passwords do not match")}</span>
              </p>
            )}
            {showPasswordMatchSuccess && (
              <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{t("Passwords match", "Passwords match")}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isPasswordLengthValid || !isPasswordMatch}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:active:scale-100 shadow-xl shadow-indigo-600/25 mt-2 cursor-pointer"
          >
            {isSubmitting ? t('Updating password…', 'Updating password…') : t('Update password', 'Update password')}
          </button>

          <div className="pt-2 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={14} /> {t("Back to Login")}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 flex items-center justify-center font-sans">
      <Suspense fallback={<div className="text-center text-slate-500 text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
