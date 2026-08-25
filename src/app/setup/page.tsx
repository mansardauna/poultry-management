'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Database, 
  ShieldCheck, 
  CreditCard, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Key, 
  ExternalLink,
  HelpCircle,
  Building2,
  Server,
  Layers,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SetupWizardPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDbTesting, setIsDbTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);

  // Form State
  const [platformName, setPlatformName] = useState('Poultry Farm Management System');
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [superAdminEmail, setSuperAdminEmail] = useState('owner@poultry.com');
  const [superAdminPassword, setSuperAdminPassword] = useState('poultry2026');
  const [showPassword, setShowPassword] = useState(false);
  const [fromEmail, setFromEmail] = useState('support@pfms-poultry.com');

  // Gateways State
  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');

  // Pricing Tiers State
  const [proPriceMonthly, setProPriceMonthly] = useState(15000);
  const [proPriceAnnual, setProPriceAnnual] = useState(144000);
  const [enterprisePriceMonthly, setEnterprisePriceMonthly] = useState(45000);
  const [enterprisePriceAnnual, setEnterprisePriceAnnual] = useState(432000);

  // 1. Fetch Existing Status on Load
  useEffect(() => {
    fetch('/api/setup')
      .then(res => res.json())
      .then(data => {
        if (data.isDatabaseConnected) {
          setDbStatus({ connected: true, message: 'Supabase Database connected successfully!' });
        } else {
          setDbStatus({ connected: false, message: 'Database connection check failed.' });
        }

        if (data.superAdminEmail) {
          setSuperAdminEmail(data.superAdminEmail);
        }

        if (data.gateways) {
          const g = data.gateways;
          if (g.platformName) setPlatformName(g.platformName);
          if (g.currencySymbol) setCurrencySymbol(g.currencySymbol);
          if (g.fromEmail) setFromEmail(g.fromEmail);
          if (g.paystackPublicKey) setPaystackPublicKey(g.paystackPublicKey);
          if (g.paystackSecretKey) setPaystackSecretKey(g.paystackSecretKey);
          if (g.stripePublicKey) setStripePublicKey(g.stripePublicKey);
          if (g.stripeSecretKey) setStripeSecretKey(g.stripeSecretKey);
          if (g.stripeWebhookSecret) setStripeWebhookSecret(g.stripeWebhookSecret);
          if (g.resendApiKey) setResendApiKey(g.resendApiKey);
          if (g.proPriceMonthly) setProPriceMonthly(g.proPriceMonthly);
          if (g.proPriceAnnual) setProPriceAnnual(g.proPriceAnnual);
          if (g.enterprisePriceMonthly) setEnterprisePriceMonthly(g.enterprisePriceMonthly);
          if (g.enterprisePriceAnnual) setEnterprisePriceAnnual(g.enterprisePriceAnnual);
        }
      })
      .catch(() => {
        setDbStatus({ connected: false, message: 'Unable to reach setup status API.' });
      })
      .finally(() => setIsLoadingStatus(false));
  }, []);

  const handleTestDatabase = async () => {
    setIsDbTesting(true);
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();
      if (data.isDatabaseConnected) {
        setDbStatus({ connected: true, message: 'Supabase Database connection verified 100%!' });
        toast.success('Database connection verified successfully!');
      } else {
        setDbStatus({ connected: false, message: data.error || 'Connection failed.' });
        toast.error('Database connection failed. Please verify environment variables.');
      }
    } catch (_e) {
      setDbStatus({ connected: false, message: 'Failed to test connection.' });
    } finally {
      setIsDbTesting(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!superAdminEmail || !superAdminPassword) {
      toast.error('Please enter a Super Admin Email and Password');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          superAdminEmail,
          superAdminPassword,
          platformName,
          currencySymbol,
          paystackPublicKey,
          paystackSecretKey,
          stripePublicKey,
          stripeSecretKey,
          stripeWebhookSecret,
          resendApiKey,
          fromEmail,
          proPriceMonthly,
          proPriceAnnual,
          enterprisePriceMonthly,
          enterprisePriceAnnual,
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Platform setup & deployment completed successfully!');
        setCurrentStep(5);
      } else {
        toast.error(data.error || 'Setup failed to complete');
      }
    } catch (_e) {
      toast.error('Error submitting setup parameters');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Environment & DB', icon: Database },
    { num: 2, title: 'Super Admin & Brand', icon: ShieldCheck },
    { num: 3, title: 'Payment Gateways', icon: CreditCard },
    { num: 4, title: 'Emails & Pricing', icon: Mail },
    { num: 5, title: 'Finish & Launch', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-10 flex flex-col justify-between">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">{platformName}</h1>
            <p className="text-xs text-slate-400">Software Buyer Installation & Deployment Wizard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
            Self-Hosted Deployment Mode
          </span>
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="max-w-5xl mx-auto w-full my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Stepper Navigation Header */}
        <div className="bg-slate-900/80 border-b border-slate-800 p-4 sm:p-6 grid grid-cols-5 gap-2 sm:gap-4">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <div 
                key={s.num}
                onClick={() => {
                  if (isDone || s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-3 rounded-2xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' 
                    : isDone 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-500 opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : isDone 
                    ? 'bg-emerald-500 text-slate-950 font-bold' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isDone ? '✓' : s.num}
                </div>
                <div className="hidden sm:block text-left truncate">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider leading-none">Step {s.num}</p>
                  <p className="text-xs font-semibold truncate mt-0.5">{s.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 sm:p-10 flex-1">
          {/* STEP 1: Database & Environment */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Step 1 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <Database className="text-indigo-400" size={24} /> Environment & Supabase Database Verification
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verify your database connection and system environment parameters before configuring platform defaults.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server size={20} className="text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Supabase Cloud Database Status</h4>
                      <p className="text-xs text-slate-400">Reading credentials from <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">.env.local</code></p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestDatabase}
                    disabled={isDbTesting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDbTesting ? 'Testing...' : 'Test Connection Again'}
                  </button>
                </div>

                {dbStatus && (
                  <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                    dbStatus.connected 
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' 
                      : 'bg-red-950/40 text-red-300 border-red-800/60'
                  }`}>
                    {dbStatus.connected ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{dbStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="bg-indigo-950/30 border border-indigo-800/40 p-4 rounded-2xl text-xs text-indigo-200 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-300">
                  <HelpCircle size={16} /> Buyer Installation Note:
                </div>
                <p>
                  Ensure your <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">SUPABASE_SERVICE_ROLE_KEY</code> are correctly filled in your project environment variables file.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Super Admin & Platform Identity */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Step 2 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="text-indigo-400" size={24} /> Super Admin Credentials & Platform Identity
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure the master Super Admin login account and customize your platform brand settings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock size={16} className="text-indigo-400" /> Master Super Admin Account
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Super Admin Email *
                    </label>
                    <input
                      type="email"
                      value={superAdminEmail}
                      onChange={(e) => setSuperAdminEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                      placeholder="e.g. owner@poultry.com"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Super Admin Password *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={superAdminPassword}
                      onChange={(e) => setSuperAdminPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pr-10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-400" /> Platform Brand & Currency
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Platform Application Name
                    </label>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                      placeholder="e.g. Poultry Farm Management System"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Primary Currency Symbol
                    </label>
                    <select
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="₦">₦ - Nigerian Naira (NGN)</option>
                      <option value="$">$ - US Dollar (USD)</option>
                      <option value="€">€ - Euro (EUR)</option>
                      <option value="£">£ - British Pound (GBP)</option>
                      <option value="KSh">KSh - Kenyan Shilling (KES)</option>
                      <option value="GH₵">GH₵ - Ghanaian Cedi (GHS)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Gateways Integration */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Step 3 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <CreditCard className="text-indigo-400" size={24} /> Payment Gateways Integration (Paystack & Stripe)
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your Paystack and Stripe merchant API keys to enable automated customer subscription checkouts and merchant invoice settlements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paystack Gateway */}
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <h3 className="text-sm font-bold text-white">Paystack Merchant Keys (NGN / Africa)</h3>
                    </div>
                    <a 
                      href="https://dashboard.paystack.com/#/settings/developer" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                    >
                      Get Keys <ExternalLink size={12} />
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Paystack Public Key (pk_test / pk_live...)
                    </label>
                    <input
                      type="text"
                      value={paystackPublicKey}
                      onChange={(e) => setPaystackPublicKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="pk_PAYSTACK_PUBLIC_KEY"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Paystack Secret Key (sk_test / sk_live...)
                    </label>
                    <input
                      type="password"
                      value={paystackSecretKey}
                      onChange={(e) => setPaystackSecretKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="sk_PAYSTACK_SECRET_KEY"
                    />
                  </div>
                </div>

                {/* Stripe Gateway */}
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                      <h3 className="text-sm font-bold text-white">Stripe Merchant Keys (Global / USD)</h3>
                    </div>
                    <a 
                      href="https://dashboard.stripe.com/apikeys" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                    >
                      Get Keys <ExternalLink size={12} />
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Stripe Publishable Key (pk_test / pk_live...)
                    </label>
                    <input
                      type="text"
                      value={stripePublicKey}
                      onChange={(e) => setStripePublicKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="pk_STRIPE_PUBLIC_KEY"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Stripe Secret Key (sk_test / sk_live...)
                    </label>
                    <input
                      type="password"
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="sk_STRIPE_SECRET_KEY"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Stripe Webhook Secret (whsec_...)
                    </label>
                    <input
                      type="password"
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Email Gateway & Subscription Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Step 4 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <Mail className="text-indigo-400" size={24} /> Transactional Emails & Subscription Pricing Tiers
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure Resend/SMTP email delivery for notifications and set your default SaaS subscription plan pricing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail size={16} className="text-indigo-400" /> Transactional Email Gateway
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Resend / Email API Key (re_...)
                    </label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      System Sender Email Address
                    </label>
                    <input
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                      placeholder="support@pfms-poultry.com"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-indigo-400" /> SaaS Plan Pricing Defaults
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Pro Monthly ({currencySymbol})</label>
                      <input
                        type="number"
                        value={proPriceMonthly}
                        onChange={(e) => setProPriceMonthly(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Pro Annual ({currencySymbol})</label>
                      <input
                        type="number"
                        value={proPriceAnnual}
                        onChange={(e) => setProPriceAnnual(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Enterprise Monthly ({currencySymbol})</label>
                      <input
                        type="number"
                        value={enterprisePriceMonthly}
                        onChange={(e) => setEnterprisePriceMonthly(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Enterprise Annual ({currencySymbol})</label>
                      <input
                        type="number"
                        value={enterprisePriceAnnual}
                        onChange={(e) => setEnterprisePriceAnnual(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Complete & Launch */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-300 max-w-xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 size={44} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white">Platform Setup Completed!</h2>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Your Poultry Farm Management System SaaS platform is fully deployed, configured, and ready to onboard farm clients.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Master Super Admin Credentials Summary
                </h4>
                <div className="text-xs font-mono space-y-1">
                  <p className="text-slate-300">Super Admin Email: <strong className="text-indigo-400">{superAdminEmail}</strong></p>
                  <p className="text-slate-300">Platform Brand: <strong className="text-indigo-400">{platformName}</strong></p>
                  <p className="text-slate-300">Default Currency: <strong className="text-emerald-400">{currencySymbol}</strong></p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link 
                  href="/dashboard/admin" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} /> Open Super Admin Dashboard
                </Link>
                <Link 
                  href="/login" 
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight size={16} /> Log In to Platform
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {currentStep < 5 && (
          <div className="bg-slate-950 border-t border-slate-800 p-4 sm:p-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleCompleteSetup}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                {isSubmitting ? 'Completing Setup...' : '⚡ Complete Installation & Save Config'}
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 font-medium pt-4">
        &copy; 2026 {platformName}. Self-Hosted Production Installer. All rights reserved.
      </div>
    </div>
  );
}
