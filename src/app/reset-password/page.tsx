'use strict';
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLanguage } from '@/components/features/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { t } = useLanguage();

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email address is required');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Resetting password...', { id: 'reset-toast' });

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword })
      });

      toast.dismiss('reset-toast');
      if (res.ok) {
        setIsSuccess(true);
        toast.success('Password updated successfully!');
      } else {
        const data = await res.json();
        toast.error(data?.error || 'Failed to reset password');
      }
    } catch (_e) {
      toast.dismiss('reset-toast');
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl bg-white shadow-2xl shadow-indigo-950/10 rounded-3xl overflow-hidden border border-slate-200/80 p-6 sm:p-12 lg:p-14 space-y-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageSelector variant="light" />
      </div>

      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-sm border border-indigo-100">
          <KeyRound size={32} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t("Reset Your Password")}</h1>
        <p className="text-sm text-slate-500 font-medium">{t("Enter your account email and specify your new password below.", "Enter your account email and specify your new password below.")}</p>
      </div>

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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md"
            >
              {t("Proceed to Login", "Proceed to Login")}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("Account email *")}</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. owner@poultry.com"
              className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 bg-slate-50 font-medium"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("New password *", "New password *")}</label>
            <input 
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("Minimum 6 characters", "Minimum 6 characters")}
              className="w-full border-2 border-slate-200 rounded-xl p-3 pr-12 text-sm focus:outline-none focus:border-indigo-600 bg-slate-50 font-medium"
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("Confirm new password *", "Confirm new password *")}</label>
            <input 
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("Re-enter new password", "Re-enter new password")}
              className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-600 bg-slate-50 font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:bg-indigo-300 mt-2 cursor-pointer"
          >
            {isSubmitting ? t('Updating password…', 'Updating password…') : t('Update password', 'Update password')}
          </button>

          <div className="pt-3 text-center">
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
