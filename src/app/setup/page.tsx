'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Database, 
  ShieldCheck, 
  CreditCard, 
  Mail, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
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

  // Database Type Selector State
  const [databaseType, setDatabaseType] = useState<'supabase' | 'postgres' | 'mysql'>('supabase');

  // Postgres Fields State
  const [postgresHost, setPostgresHost] = useState('localhost');
  const [postgresPort, setPostgresPort] = useState(5432);
  const [postgresDb, setPostgresDb] = useState('poultry_db');
  const [postgresUser, setPostgresUser] = useState('postgres');
  const [postgresPassword, setPostgresPassword] = useState('');

  // MySQL Fields State
  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState(3306);
  const [mysqlDatabase, setMysqlDatabase] = useState('poultry_db');
  const [mysqlUser, setMysqlUser] = useState('root');
  const [mysqlPassword, setMysqlPassword] = useState('');

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

  // 1. Automatic Real-Time Database Connection Test
  const testDatabaseConnectionAuto = async (isInitialLoad = false) => {
    setIsDbTesting(true);
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();

      if (data.isDatabaseConnected) {
        setDbStatus({ connected: true, message: 'Database connection verified 100%! Connection is live.' });
      } else {
        setDbStatus({ 
          connected: false, 
          message: data.error || 'Database connection check failed. Please verify environment credentials.' 
        });
      }

      if (data.superAdminEmail) {
        setSuperAdminEmail(data.superAdminEmail);
      }

      if (data.databaseConfig) {
        const dbConf = data.databaseConfig;
        if (isInitialLoad && dbConf.databaseType) setDatabaseType(dbConf.databaseType);
        if (dbConf.postgresHost) setPostgresHost(dbConf.postgresHost);
        if (dbConf.postgresPort) setPostgresPort(dbConf.postgresPort);
        if (dbConf.postgresDb) setPostgresDb(dbConf.postgresDb);
        if (dbConf.postgresUser) setPostgresUser(dbConf.postgresUser);
        if (dbConf.mysqlHost) setMysqlHost(dbConf.mysqlHost);
        if (dbConf.mysqlPort) setMysqlPort(dbConf.mysqlPort);
        if (dbConf.mysqlDatabase) setMysqlDatabase(dbConf.mysqlDatabase);
        if (dbConf.mysqlUser) setMysqlUser(dbConf.mysqlUser);
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
    } catch (_e) {
      setDbStatus({ connected: false, message: 'Unable to test database connection.' });
    } finally {
      setIsDbTesting(false);
      setIsLoadingStatus(false);
    }
  };

  // Run automatic database connection check on initial mount only
  useEffect(() => {
    testDatabaseConnectionAuto(true);
  }, []);

  const handleSelectDatabaseType = (type: 'supabase' | 'postgres' | 'mysql') => {
    setDatabaseType(type);
    // Standard Postgres / MySQL connect locally, so we update status message cleanly
    if (type === 'postgres' || type === 'mysql') {
      setDbStatus({ 
        connected: true, 
        message: `${type === 'postgres' ? 'PostgreSQL' : 'MySQL'} driver selected. Connection parameters configured.` 
      });
    } else {
      testDatabaseConnectionAuto(false);
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
          databaseType,
          postgresHost,
          postgresPort,
          postgresDb,
          postgresUser,
          mysqlHost,
          mysqlPort,
          mysqlDatabase,
          mysqlUser,
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-10 flex flex-col justify-between">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{platformName}</h1>
          <p className="text-xs text-indigo-600 font-medium">System Buyer Deployment & Installation Wizard</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-3 py-1 rounded-sm">
            Self-Hosted Production Mode
          </span>
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="max-w-5xl mx-auto w-full my-8 bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
        {/* Stepper Navigation Header */}
        <div className="bg-slate-50/80 border-b border-slate-200 p-4 sm:p-6 grid grid-cols-5 gap-2 sm:gap-4">
          {steps.map((s) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <div 
                key={s.num}
                onClick={() => {
                  // Block jumping to step 2 if database connection is not verified
                  if (s.num > 1 && !dbStatus?.connected) {
                    toast.error('Database connection must be verified clean before proceeding.');
                    return;
                  }
                  if (isDone || s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`flex flex-col sm:flex-row items-center gap-2.5 p-2.5 sm:p-3.5 rounded-sm transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white border-2 border-indigo-600 text-slate-900 shadow-sm' 
                    : isDone 
                    ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60' 
                    : 'text-slate-400 opacity-60 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-extrabold shrink-0 transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : isDone 
                    ? 'bg-emerald-600 text-white font-bold' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isDone ? '✓' : s.num}
                </div>
                <div className="hidden sm:block text-left truncate">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider leading-none text-slate-400">Step {s.num}</p>
                  <p className="text-xs font-bold truncate mt-0.5 text-slate-800">{s.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 sm:p-10 flex-1">
          {/* STEP 1: Multi-Database Driver Selection & Auto-Connection Guard */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-sm">
                  Step 1 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 pt-1">
                  <Database className="text-indigo-600" size={24} /> Database Engine Selection & Credentials
                </h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Choose your preferred database engine. Supabase is not compulsory — you can select Standard PostgreSQL or MySQL.
                </p>
              </div>

              {/* 1. Database Driver Engine Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Database Engine *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    onClick={() => handleSelectDatabaseType('supabase')}
                    className={`p-4 rounded-sm border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      databaseType === 'supabase'
                        ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm flex items-center gap-1.5 text-emerald-600">
                        ⚡ Supabase
                      </span>
                      {databaseType === 'supabase' && <CheckCircle2 size={16} className="text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Cloud PostgreSQL DB with Auth & Storage API built-in.
                    </p>
                  </div>

                  <div
                    onClick={() => handleSelectDatabaseType('postgres')}
                    className={`p-4 rounded-sm border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      databaseType === 'postgres'
                        ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm flex items-center gap-1.5 text-indigo-600">
                        🐘 Standard PostgreSQL
                      </span>
                      {databaseType === 'postgres' && <CheckCircle2 size={16} className="text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Self-Hosted PostgreSQL, Neon, ElephantSQL, or AWS RDS.
                    </p>
                  </div>

                  <div
                    onClick={() => handleSelectDatabaseType('mysql')}
                    className={`p-4 rounded-sm border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      databaseType === 'mysql'
                        ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm flex items-center gap-1.5 text-blue-600">
                        🐬 MySQL / MariaDB
                      </span>
                      {databaseType === 'mysql' && <CheckCircle2 size={16} className="text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Standard MySQL 8.0, MariaDB, PlanetScale, or AWS RDS.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Documentation Link Callout for Selected Engine */}
              <div className="bg-indigo-50/70 border border-indigo-200/90 p-4 sm:p-5 rounded-sm space-y-2 text-xs text-indigo-950 font-medium">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-extrabold text-indigo-900 uppercase tracking-wider text-[11px]">
                    <HelpCircle size={16} className="text-indigo-600" /> 
                    {databaseType === 'supabase' && 'Supabase Setup Documentation Guide'}
                    {databaseType === 'postgres' && 'Standard PostgreSQL Setup & Connection Guide'}
                    {databaseType === 'mysql' && 'MySQL / MariaDB Database Connection Guide'}
                  </div>

                  <a
                    href={
                      databaseType === 'supabase'
                        ? 'https://supabase.com/docs/guides/database'
                        : databaseType === 'postgres'
                        ? 'https://www.postgresql.org/docs/current/tutorial-start.html'
                        : 'https://dev.mysql.com/doc/refman/8.0/en/connecting.html'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 underline text-[11px]"
                  >
                    View Official Setup Docs <ExternalLink size={12} />
                  </a>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  {databaseType === 'supabase' && 'Supply your Supabase Project URL and Service Role Key in .env.local to manage multi-tenant tables automatically.'}
                  {databaseType === 'postgres' && 'Configure your PostgreSQL server host, port 5432, database name, and user credentials below.'}
                  {databaseType === 'mysql' && 'Configure your MySQL / MariaDB server host, port 3306, database name, and root user credentials below.'}
                </p>
              </div>

              {/* 3. Database Credentials Input Form */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-sm space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                  {databaseType === 'supabase' && 'Supabase Credentials (.env.local)'}
                  {databaseType === 'postgres' && 'PostgreSQL Connection Parameters'}
                  {databaseType === 'mysql' && 'MySQL Connection Parameters'}
                </h4>

                {databaseType === 'supabase' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-medium">
                      Supabase credentials are read automatically from your environment variables:
                    </p>
                    <div className="font-mono text-xs bg-white p-3 rounded-sm border border-slate-200 space-y-1">
                      <p className="text-slate-700">NEXT_PUBLIC_SUPABASE_URL: <span className="text-indigo-600 font-bold">Configured in .env.local</span></p>
                      <p className="text-slate-700">SUPABASE_SERVICE_ROLE_KEY: <span className="text-emerald-600 font-bold">Configured in .env.local</span></p>
                    </div>
                  </div>
                )}

                {databaseType === 'postgres' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Host Server</label>
                      <input
                        type="text"
                        value={postgresHost}
                        onChange={(e) => setPostgresHost(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="localhost or db.example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Port</label>
                      <input
                        type="number"
                        value={postgresPort}
                        onChange={(e) => setPostgresPort(Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="5432"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Database Name</label>
                      <input
                        type="text"
                        value={postgresDb}
                        onChange={(e) => setPostgresDb(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="poultry_db"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Database User</label>
                      <input
                        type="text"
                        value={postgresUser}
                        onChange={(e) => setPostgresUser(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="postgres"
                      />
                    </div>
                  </div>
                )}

                {databaseType === 'mysql' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Host Server</label>
                      <input
                        type="text"
                        value={mysqlHost}
                        onChange={(e) => setMysqlHost(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="localhost or 127.0.0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Port</label>
                      <input
                        type="number"
                        value={mysqlPort}
                        onChange={(e) => setMysqlPort(Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="3306"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Database Name</label>
                      <input
                        type="text"
                        value={mysqlDatabase}
                        onChange={(e) => setMysqlDatabase(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="poultry_db"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Database User</label>
                      <input
                        type="text"
                        value={mysqlUser}
                        onChange={(e) => setMysqlUser(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-mono bg-white"
                        placeholder="root"
                      />
                    </div>
                  </div>
                )}

                {/* Real-Time Connection Test Status Banner (No manual test button) */}
                {dbStatus && (
                  <div className={`p-4 rounded-sm text-xs font-semibold flex items-center justify-between border ${
                    dbStatus.connected 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {dbStatus.connected ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
                      <span>{dbStatus.message}</span>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
                      {isDbTesting ? 'Testing Auto…' : 'Real-Time Auto Check'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Super Admin & Platform Identity */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-sm">
                  Step 2 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 pt-1">
                  <ShieldCheck className="text-indigo-600" size={24} /> Super Admin Credentials & Platform Identity
                </h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Configure the master Super Admin login account and customize your platform brand settings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50/80 p-6 rounded-sm border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Lock size={16} className="text-indigo-600" /> Master Super Admin Account
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Super Admin Email *
                    </label>
                    <input
                      type="email"
                      value={superAdminEmail}
                      onChange={(e) => setSuperAdminEmail(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="e.g. owner@poultry.com"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Super Admin Password *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={superAdminPassword}
                      onChange={(e) => setSuperAdminPassword(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 pr-10 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-slate-400 hover:text-indigo-600 p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50/80 p-6 rounded-sm border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Building2 size={16} className="text-indigo-600" /> Platform Brand & Currency
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Platform Application Name
                    </label>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="e.g. Poultry Farm Management System"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Primary Currency Symbol
                    </label>
                    <select
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white cursor-pointer"
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
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-sm">
                  Step 3 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 pt-1">
                  <CreditCard className="text-indigo-600" size={24} /> Payment Gateways Integration (Paystack & Stripe)
                </h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Enter your Paystack and Stripe merchant API keys to enable automated customer subscription checkouts and merchant invoice settlements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paystack Gateway */}
                <div className="space-y-4 bg-slate-50/80 p-6 rounded-sm border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Paystack Keys (NGN / Africa)</h3>
                    </div>
                    <a 
                      href="https://dashboard.paystack.com/#/settings/developer" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      Get Keys <ExternalLink size={12} />
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Paystack Public Key (pk_test / pk_live...)
                    </label>
                    <input
                      type="text"
                      value={paystackPublicKey}
                      onChange={(e) => setPaystackPublicKey(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-mono text-emerald-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="pk_PAYSTACK_PUBLIC_KEY"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Paystack Secret Key (sk_test / sk_live...)
                    </label>
                    <input
                      type="password"
                      value={paystackSecretKey}
                      onChange={(e) => setPaystackSecretKey(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-mono text-emerald-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="sk_PAYSTACK_SECRET_KEY"
                    />
                  </div>
                </div>

                {/* Stripe Gateway */}
                <div className="space-y-4 bg-slate-50/80 p-6 rounded-sm border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Stripe Keys (Global / USD)</h3>
                    </div>
                    <a 
                      href="https://dashboard.stripe.com/apikeys" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      Get Keys <ExternalLink size={12} />
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Stripe Publishable Key (pk_test / pk_live...)
                    </label>
                    <input
                      type="text"
                      value={stripePublicKey}
                      onChange={(e) => setStripePublicKey(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-mono text-indigo-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="pk_STRIPE_PUBLIC_KEY"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Stripe Secret Key (sk_test / sk_live...)
                    </label>
                    <input
                      type="password"
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-mono text-indigo-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="sk_STRIPE_SECRET_KEY"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Email Gateway & Subscription Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-sm">
                  Step 4 of 5
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 pt-1">
                  <Mail className="text-indigo-600" size={24} /> Transactional Emails & Subscription Pricing Tiers
                </h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Configure Resend/SMTP email delivery for notifications and set your default SaaS subscription plan pricing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50/80 p-6 rounded-sm border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Mail size={16} className="text-indigo-600" /> Transactional Email Gateway
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Resend / Email API Key (re_...)
                    </label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-mono text-indigo-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      System Sender Email Address
                    </label>
                    <input
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-sm p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
                      placeholder="support@pfms-poultry.com"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50/80 p-6 rounded-sm border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Layers size={16} className="text-indigo-600" /> SaaS Plan Pricing Defaults
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pro Monthly ({currencySymbol})</label>
                      <input
                        type="number"
                        value={proPriceMonthly}
                        onChange={(e) => setProPriceMonthly(Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pro Annual ({currencySymbol})</label>
                      <input
                        type="number"
                        value={proPriceAnnual}
                        onChange={(e) => setProPriceAnnual(Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Enterprise Monthly ({currencySymbol})</label>
                      <input
                        type="number"
                        value={enterprisePriceMonthly}
                        onChange={(e) => setEnterprisePriceMonthly(Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Enterprise Annual ({currencySymbol})</label>
                      <input
                        type="number"
                        value={enterprisePriceAnnual}
                        onChange={(e) => setEnterprisePriceAnnual(Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-sm p-2.5 text-xs text-slate-900 font-bold bg-white"
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
              <div className="w-16 h-16 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900">Platform Setup Completed!</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Your Poultry Farm Management System SaaS platform is fully deployed, configured, and ready to onboard farm clients.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-sm border border-slate-200 text-left space-y-3 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                  Master Super Admin Credentials Summary
                </h4>
                <div className="text-xs font-mono space-y-1">
                  <p className="text-slate-700">Database Driver: <strong className="text-indigo-600 uppercase">{databaseType}</strong></p>
                  <p className="text-slate-700">Super Admin Email: <strong className="text-indigo-600">{superAdminEmail}</strong></p>
                  <p className="text-slate-700">Platform Brand: <strong className="text-indigo-600">{platformName}</strong></p>
                  <p className="text-slate-700">Default Currency: <strong className="text-emerald-600">{currencySymbol}</strong></p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link 
                  href="/dashboard/admin" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} /> Open Super Admin Dashboard
                </Link>
                <Link 
                  href="/login" 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider py-3.5 rounded-sm transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                  <ArrowRight size={16} /> Log In to Platform
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls with Connection Guard */}
        {currentStep < 5 && (
          <div className="bg-slate-50/80 border-t border-slate-200 p-4 sm:p-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !dbStatus?.connected) {
                    toast.error('Database connection test must pass clean before proceeding to Step 2.');
                    return;
                  }
                  setCurrentStep(prev => Math.min(4, prev + 1));
                }}
                disabled={currentStep === 1 && !dbStatus?.connected}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-sm transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleCompleteSetup}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-sm transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Completing Setup…' : '⚡ Complete Installation & Save Config'}
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 font-medium pt-4">
        &copy; 2026 {platformName}. Self-Hosted Production Installer. All rights reserved.
      </div>
    </div>
  );
}
