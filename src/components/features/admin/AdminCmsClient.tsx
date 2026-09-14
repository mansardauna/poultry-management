'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, 
  Save, 
  RefreshCw, 
  Layers, 
  CheckCircle, 
  Video, 
  Sparkles, 
  FileSpreadsheet, 
  Building2, 
  HelpCircle,
  Database,
  Key,
  Lock,
  CreditCard,
  Mail,
  Settings,
  Activity,
  Server,
  Eye,
  EyeOff,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface SaasPlanConfig {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  maxBranches: number;
  cctvEnabled: boolean;
  aiLoggerEnabled: boolean;
  exportReportsEnabled: boolean;
  enterpriseHubEnabled: boolean;
  features: string[];
}

export function AdminCmsClient({ 
  initialPlans, 
  currentUserEmail,
  userRole = 'SuperAdmin',
  allSubscriptions = [],
  allHistory = [],
  allOrgs = []
}: { 
  initialPlans: SaasPlanConfig[]; 
  currentUserEmail: string;
  userRole?: string;
  allSubscriptions?: any[];
  allHistory?: any[];
  allOrgs?: any[];
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'plans' | 'cms' | 'orgs' | 'settings'>('overview');

  useEffect(() => {
    if (tabParam === 'setup' || tabParam === 'plans' || tabParam === 'cms' || tabParam === 'orgs' || tabParam === 'settings' || tabParam === 'overview') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const [plans, setPlans] = useState<SaasPlanConfig[]>(initialPlans);
  const [isSaving, setIsSaving] = useState(false);

  // Landing Page CMS State
  const [heroHeading, setHeroHeading] = useState('Precision Poultry Farm Management Platform');
  const [heroSubtitle, setHeroSubtitle] = useState('Empower farm managers with operational telemetry to track flock health, predict egg yields, and execute at peak efficiency.');
  const [announcementBanner, setAnnouncementBanner] = useState('New Release: Voice Auto-Logger & Multi-Farm Enterprise Hub live now');
  const [supportPhone, setSupportPhone] = useState('+234 800 768 5879');
  const [supportEmail, setSupportEmail] = useState('support@pfms-poultry.com');

  // Setup Parameters & Gateways State (Populated from /api/setup)
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [isDbTesting, setIsDbTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);

  const [databaseType, setDatabaseType] = useState<'supabase' | 'postgres' | 'mysql'>('supabase');
  const [postgresHost, setPostgresHost] = useState('localhost');
  const [postgresPort, setPostgresPort] = useState(5432);
  const [postgresDb, setPostgresDb] = useState('poultry_db');
  const [postgresUser, setPostgresUser] = useState('postgres');

  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState(3306);
  const [mysqlDatabase, setMysqlDatabase] = useState('poultry_db');
  const [mysqlUser, setMysqlUser] = useState('root');

  const [platformName, setPlatformName] = useState('PFMS');
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [superAdminEmailState, setSuperAdminEmailState] = useState(currentUserEmail || 'owner@poultry.com');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fromEmail, setFromEmail] = useState('support@pfms-poultry.com');

  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [showPaystackSecret, setShowPaystackSecret] = useState(false);

  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  const [resendApiKey, setResendApiKey] = useState('');
  const [showResendKey, setShowResendKey] = useState(false);

  const [proPriceMonthly, setProPriceMonthly] = useState(15000);
  const [proPriceAnnual, setProPriceAnnual] = useState(144000);
  const [enterprisePriceMonthly, setEnterprisePriceMonthly] = useState(45000);
  const [enterprisePriceAnnual, setEnterprisePriceAnnual] = useState(432000);

  // Load Setup Parameters from GET /api/setup
  const loadSetupParams = async () => {
    setIsLoadingSetup(true);
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();

      if (data.isDatabaseConnected) {
        setDbStatus({ connected: true, message: 'Database connection verified 100%! Connection is live.' });
      } else {
        setDbStatus({ connected: false, message: data.error || 'Database connection check failed.' });
      }

      if (data.superAdminEmail) {
        setSuperAdminEmailState(data.superAdminEmail);
      }

      if (data.databaseConfig) {
        const dbConf = data.databaseConfig;
        if (dbConf.databaseType) setDatabaseType(dbConf.databaseType);
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
      toast.error('Unable to fetch live setup parameters');
    } finally {
      setIsLoadingSetup(false);
    }
  };

  useEffect(() => {
    loadSetupParams();

    // Fetch CMS Content
    fetch('/api/admin/cms')
      .then(res => res.json())
      .then(data => {
        if (data.heroHeading) setHeroHeading(data.heroHeading);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
        if (data.announcementBanner) setAnnouncementBanner(data.announcementBanner);
        if (data.supportPhone) setSupportPhone(data.supportPhone);
        if (data.supportEmail) setSupportEmail(data.supportEmail);
      })
      .catch(() => {});
  }, []);

  // Test Database Connection via POST /api/setup/test
  const testDatabaseConnection = async () => {
    setIsDbTesting(true);
    try {
      const res = await fetch('/api/setup/test', {
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
        })
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        setDbStatus({ connected: true, message: data.message || 'Database connection verified 100%!' });
        toast.success(data.message || 'Database connection verified!');
      } else {
        setDbStatus({ connected: false, message: data.error || 'Connection failed.' });
        toast.error(data.error || 'Database connection failed');
      }
    } catch (_e) {
      toast.error('Error testing database connection');
    } finally {
      setIsDbTesting(false);
    }
  };

  // Save Setup Parameters via POST /api/setup
  const handleSaveSetupParams = async () => {
    setIsSaving(true);
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
          superAdminEmail: superAdminEmailState,
          superAdminPassword: superAdminPassword || undefined,
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
        toast.success('Setup parameters & merchant keys saved successfully!');
        loadSetupParams();
      } else {
        toast.error(data.error || 'Failed to save setup parameters');
      }
    } catch (_e) {
      toast.error('Error saving setup parameters');
    } finally {
      setIsSaving(false);
    }
  };

  const totalRevenue = allHistory.reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const activeProCount = allOrgs.filter(o => o.subscriptionTier === 'pro').length;
  const activeEnterpriseCount = allOrgs.filter(o => o.subscriptionTier === 'enterprise' || o.subscriptionTier === 'entrepreneur').length;

  const handleFieldChange = (planId: string, field: keyof SaasPlanConfig, value: any) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const handleSaveAllPlans = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'SaaS plans & feature entitlements updated successfully!');
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      toast.error('Error saving plans configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCms = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroHeading,
          heroSubtitle,
          announcementBanner,
          supportPhone,
          supportEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Landing Page CMS content saved & published live!');
      } else {
        toast.error(data.error || 'Failed to save CMS');
      }
    } catch {
      toast.error('Error saving CMS content');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Super Admin Control Center ({currentUserEmail || superAdminEmailState || 'Super Admin'})
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{platformName} Master Super Admin Portal</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage live platform setup parameters, database drivers, payment keys, SaaS plans, and landing CMS.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/documentation/superadmin-setup-guide.html"
            target="_blank"
            rel="noreferrer"
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <HelpCircle size={16} />
            <span>Super Admin Docs</span>
          </a>

          {activeTab === 'setup' && (
            <button
              onClick={handleSaveSetupParams}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save & Apply Setup</span>
            </button>
          )}

          {activeTab === 'cms' && (
            <button
              onClick={handleSaveCms}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Publish Landing CMS</span>
            </button>
          )}

          {activeTab === 'plans' && (
            <button
              onClick={handleSaveAllPlans}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save Plan Features</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Portal Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-t-xl'
          }`}
        >
          <Activity size={16} />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'setup'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-t-xl'
          }`}
        >
          <Settings size={16} />
          <span>Setup & Gateways</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'plans'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-t-xl'
          }`}
        >
          <Layers size={16} />
          <span>SaaS Plans & Entitlements</span>
        </button>

        <button
          onClick={() => setActiveTab('cms')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cms'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-t-xl'
          }`}
        >
          <Sparkles size={16} />
          <span>Landing Page CMS</span>
        </button>

        <button
          onClick={() => setActiveTab('orgs')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orgs'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-t-xl'
          }`}
        >
          <Building2 size={16} />
          <span>Tenant Farm Organizations ({allOrgs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-t-xl'
          }`}
        >
          <Server size={16} />
          <span>System Governance</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-extrabold uppercase text-purple-900 flex items-center justify-between">
                  <span>Monthly Recurring Revenue</span>
                  <DollarSign size={18} className="text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-purple-950">
                  {currencySymbol}{totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-purple-700 font-medium mt-1">Aggregated merchant subscriptions</p>
              </CardContent>
            </Card>

            <Card className="border border-indigo-200 bg-indigo-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-extrabold uppercase text-indigo-900 flex items-center justify-between">
                  <span>Tenant Farm Workspaces</span>
                  <Building2 size={18} className="text-indigo-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-indigo-950">{allOrgs.length}</div>
                <p className="text-xs text-indigo-700 font-medium mt-1">
                  Pro: {activeProCount} | Enterprise: {activeEnterpriseCount}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200 bg-emerald-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-extrabold uppercase text-emerald-900 flex items-center justify-between">
                  <span>Database Engine Driver</span>
                  <Database size={18} className="text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-950 uppercase">{databaseType}</div>
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  {dbStatus?.connected ? '✓ Real-time status live' : '⚠ Connection check required'}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-extrabold uppercase text-amber-900 flex items-center justify-between">
                  <span>Platform Application Title</span>
                  <ShieldCheck size={18} className="text-amber-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-amber-950 truncate">{platformName}</div>
                <p className="text-xs text-amber-700 font-medium mt-1">Currency: {currencySymbol}</p>
              </CardContent>
            </Card>
          </div>

          {/* Real-time DB Guard Status Bar */}
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
            dbStatus?.connected ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {dbStatus?.connected ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-red-600" />}
              <div>
                <span className="font-bold block text-sm">{dbStatus?.message || 'Database status unknown'}</span>
                <span className="text-[11px] opacity-80">Engine: {databaseType.toUpperCase()} Driver</span>
              </div>
            </div>

            <button
              onClick={testDatabaseConnection}
              disabled={isDbTesting}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {isDbTesting ? <RefreshCw className="animate-spin" size={14} /> : <Database size={14} />}
              <span>Test Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SETUP PARAMETERS & GATEWAYS */}
      {activeTab === 'setup' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-purple-50/80 border border-purple-200 p-6 rounded-2xl space-y-2">
            <h2 className="text-lg font-extrabold text-purple-950 flex items-center gap-2">
              <Settings size={20} className="text-purple-700" /> Live Setup Parameters & Gateway Management
            </h2>
            <p className="text-xs text-purple-800 font-medium leading-relaxed">
              Below are the live parameter values populated from installation. You can test database connectivity, edit merchant API keys, change platform currency, update superadmin credentials, and save changes live without re-running installer scripts!
            </p>
          </div>

          {/* 1. Database Driver & Connection Parameters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Database size={18} className="text-indigo-600" /> Database Engine Driver & Connection Parameters
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select your database engine driver and verify live host connectivity.
                </p>
              </div>

              <button
                onClick={testDatabaseConnection}
                disabled={isDbTesting}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDbTesting ? <RefreshCw className="animate-spin" size={14} /> : <Database size={14} />}
                <span>Test Live Connection</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setDatabaseType('supabase')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  databaseType === 'supabase' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                  <span className="text-emerald-700">Supabase Cloud</span>
                  {databaseType === 'supabase' && <CheckCircle size={16} className="text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Cloud PostgreSQL with Auth & Storage API</p>
              </div>

              <div
                onClick={() => setDatabaseType('postgres')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  databaseType === 'postgres' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                  <span className="text-indigo-700">Standard PostgreSQL</span>
                  {databaseType === 'postgres' && <CheckCircle size={16} className="text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Self-hosted Postgres / AWS RDS / Neon</p>
              </div>

              <div
                onClick={() => setDatabaseType('mysql')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  databaseType === 'mysql' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                  <span className="text-blue-700">MySQL / MariaDB</span>
                  {databaseType === 'mysql' && <CheckCircle size={16} className="text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">MySQL 8.0 / MariaDB / cPanel hosting</p>
              </div>
            </div>

            {databaseType === 'postgres' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Postgres Host</label>
                  <input
                    type="text"
                    value={postgresHost}
                    onChange={(e) => setPostgresHost(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Postgres Port</label>
                  <input
                    type="number"
                    value={postgresPort}
                    onChange={(e) => setPostgresPort(Number(e.target.value))}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Database Name</label>
                  <input
                    type="text"
                    value={postgresDb}
                    onChange={(e) => setPostgresDb(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Database User</label>
                  <input
                    type="text"
                    value={postgresUser}
                    onChange={(e) => setPostgresUser(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
              </div>
            )}

            {databaseType === 'mysql' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">MySQL Host</label>
                  <input
                    type="text"
                    value={mysqlHost}
                    onChange={(e) => setMysqlHost(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">MySQL Port</label>
                  <input
                    type="number"
                    value={mysqlPort}
                    onChange={(e) => setMysqlPort(Number(e.target.value))}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Database Name</label>
                  <input
                    type="text"
                    value={mysqlDatabase}
                    onChange={(e) => setMysqlDatabase(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Database User</label>
                  <input
                    type="text"
                    value={mysqlUser}
                    onChange={(e) => setMysqlUser(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs font-mono bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Platform Brand Identity & Super Admin Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" /> Platform Brand & Currency Symbol
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Application Title</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Primary Currency Symbol</label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-extrabold text-slate-800 bg-slate-50 focus:bg-white"
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

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Lock size={16} className="text-indigo-600" /> Master Super Admin Credentials
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Super Admin Email</label>
                <input
                  type="email"
                  value={superAdminEmailState}
                  onChange={(e) => setSuperAdminEmailState(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Update Super Admin Password (Optional)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 pr-10 text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white"
                  placeholder="Leave blank to keep current password"
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
          </div>

          {/* 3. Merchant Payment Gateways */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paystack Gateway */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-600" /> Paystack Merchant Keys (NGN)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaystackSecret(!showPaystackSecret)}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showPaystackSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPaystackSecret ? 'Hide Secret' : 'Show Secret'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Paystack Public Key</label>
                <input
                  type="text"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-emerald-800 bg-slate-50 focus:bg-white"
                  placeholder="pk_PAYSTACK_PUBLIC_KEY"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Paystack Secret Key</label>
                <input
                  type={showPaystackSecret ? 'text' : 'password'}
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-emerald-800 bg-slate-50 focus:bg-white"
                  placeholder="sk_PAYSTACK_SECRET_KEY"
                />
              </div>
            </div>

            {/* Stripe Gateway */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-indigo-600" /> Stripe Merchant Keys (USD)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStripeSecret(!showStripeSecret)}
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showStripeSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showStripeSecret ? 'Hide Secrets' : 'Show Secrets'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Stripe Publishable Key</label>
                <input
                  type="text"
                  value={stripePublicKey}
                  onChange={(e) => setStripePublicKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-indigo-800 bg-slate-50 focus:bg-white"
                  placeholder="pk_STRIPE_PUBLIC_KEY"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Stripe Secret Key</label>
                <input
                  type={showStripeSecret ? 'text' : 'password'}
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-indigo-800 bg-slate-50 focus:bg-white"
                  placeholder="sk_STRIPE_SECRET_KEY"
                />
              </div>
            </div>
          </div>

          {/* Save Setup Parameters Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSetupParams}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save & Apply Setup Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SAAS PLANS & ENTITLEMENTS */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-purple-600" /> SaaS Subscription Pricing Tiers & Feature Entitlements
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Customize pricing and toggle feature flags (CCTV, AI Logger, PDF/Excel Exports, White-Label) for each subscription tier.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-2 border-slate-200 shadow-sm flex flex-col justify-between">
                <CardHeader className="bg-slate-50/80 border-b border-slate-200 pb-4">
                  <CardTitle className="text-base font-extrabold text-slate-900 flex items-center justify-between">
                    <span>{plan.name}</span>
                    <span className="text-xs uppercase bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded font-extrabold">
                      {plan.id}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 font-medium mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Monthly ({currencySymbol})</label>
                      <input
                        type="number"
                        value={plan.priceMonthly}
                        onChange={(e) => handleFieldChange(plan.id, 'priceMonthly', Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-extrabold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Annual ({currencySymbol})</label>
                      <input
                        type="number"
                        value={plan.priceAnnual}
                        onChange={(e) => handleFieldChange(plan.id, 'priceAnnual', Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-extrabold bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.cctvEnabled}
                        onChange={(e) => handleFieldChange(plan.id, 'cctvEnabled', e.target.checked)}
                        className="rounded text-purple-600 w-4 h-4"
                      />
                      <span>CCTV Live Surveillance</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.aiLoggerEnabled}
                        onChange={(e) => handleFieldChange(plan.id, 'aiLoggerEnabled', e.target.checked)}
                        className="rounded text-purple-600 w-4 h-4"
                      />
                      <span>AI Voice Auto-Logger</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.exportReportsEnabled}
                        onChange={(e) => handleFieldChange(plan.id, 'exportReportsEnabled', e.target.checked)}
                        className="rounded text-purple-600 w-4 h-4"
                      />
                      <span>PDF & Excel Report Exports</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.enterpriseHubEnabled}
                        onChange={(e) => handleFieldChange(plan.id, 'enterpriseHubEnabled', e.target.checked)}
                        className="rounded text-purple-600 w-4 h-4"
                      />
                      <span>Multi-Branch Enterprise Hub</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LANDING PAGE CMS */}
      {activeTab === 'cms' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-purple-600" /> Public Landing Page Content Editor
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Edit public hero headlines, announcement banners, and support contact details live on your homepage.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Hero Headline</label>
                <input
                  type="text"
                  value={heroHeading}
                  onChange={(e) => setHeroHeading(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Hero Subtitle</label>
                <textarea
                  rows={3}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Top Announcement Banner</label>
                <input
                  type="text"
                  value={announcementBanner}
                  onChange={(e) => setAnnouncementBanner(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Support Phone</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TENANT ORGANIZATIONS */}
      {activeTab === 'orgs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-purple-600" /> Registered Farm Tenant Accounts ({allOrgs.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Global directory of all farm organization workspaces registered on this platform.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-600">
                <tr>
                  <th className="p-4">Organization Name</th>
                  <th className="p-4">Subscription Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {allOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">No organization workspaces registered yet.</td>
                  </tr>
                ) : (
                  allOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/80">
                      <td className="p-4 font-bold text-slate-900">{org.name}</td>
                      <td className="p-4">
                        <span className="bg-purple-100 text-purple-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase">
                          {org.subscriptionTier || 'Free Starter'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase">
                          {org.subscriptionStatus || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <a href="/dashboard" className="text-indigo-600 font-bold hover:underline">View Telemetry →</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM GOVERNANCE */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Server size={20} className="text-purple-600" /> Platform Maintenance & System Governance
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Global system diagnostics, database schema integrity, and platform maintenance shortcuts.
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase">Database Driver Status</h4>
                <p className="text-xs text-slate-500 font-mono">Engine: {databaseType.toUpperCase()}</p>
                <p className="text-xs text-emerald-700 font-bold">Status: Healthy & Active</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase">Deployment Environment</h4>
                <p className="text-xs text-slate-500 font-mono">Node.js Next.js 16 (Turbopack)</p>
                <p className="text-xs text-indigo-700 font-bold">Mode: Production Self-Hosted</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
