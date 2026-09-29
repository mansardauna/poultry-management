'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Save, 
  RefreshCw, 
  Layers, 
  Building2, 
  BarChart3, 
  HelpCircle,
  Lock,
  CreditCard,
  Mail,
  Settings,
  Server,
  Eye,
  EyeOff,
  DollarSign,
  ShieldCheck,
  Plus,
  Trash2,
  Mic,
  CheckCircle2,
  Video,
  Sparkles,
  FileSpreadsheet,
  UserPlus,
  LogIn,
  ExternalLink,
  X,
  ChevronRight,
  Activity,
  Users,
  Upload,
  Bot,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useLanguage } from '@/components/features/LanguageContext';

export const AI_PRESETS: Record<string, { 
  name: string; 
  badge: string;
  defaultModel: string; 
  models: string[]; 
  keyPlaceholder: string; 
  consoleUrl: string;
  defaultBaseUrl?: string;
}> = {
  gemini: {
    name: 'Google Gemini',
    badge: 'Recommended',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    keyPlaceholder: 'AIzaSy...',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    badge: 'Industry Standard',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini'],
    keyPlaceholder: 'sk-proj-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
  },
  groq: {
    name: 'Groq Cloud (Llama 3.3)',
    badge: 'Ultra Fast',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    keyPlaceholder: 'gsk_...',
    consoleUrl: 'https://console.groq.com/keys',
  },
  deepseek: {
    name: 'DeepSeek AI',
    badge: 'High Value',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    keyPlaceholder: 'sk-...',
    consoleUrl: 'https://platform.deepseek.com/api_keys',
  },
  anthropic: {
    name: 'Anthropic Claude',
    badge: 'High Precision',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    keyPlaceholder: 'sk-ant-api03-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
  },
  openrouter: {
    name: 'OpenRouter (200+ Unified Models)',
    badge: 'All-in-One Hub',
    defaultModel: 'google/gemini-2.0-flash-001',
    models: ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat', 'mistralai/mistral-large-2411'],
    keyPlaceholder: 'sk-or-v1-...',
    consoleUrl: 'https://openrouter.ai/keys',
  },
  mistral: {
    name: 'Mistral AI',
    badge: 'Open Weights Leader',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-small-latest', 'mistral-large-latest', 'codestral-latest', 'pixtral-large-latest'],
    keyPlaceholder: '...',
    consoleUrl: 'https://console.mistral.ai/api-keys/',
  },
  xai: {
    name: 'xAI (Grok)',
    badge: 'Frontier AI',
    defaultModel: 'grok-beta',
    models: ['grok-beta', 'grok-2-latest', 'grok-vision-beta'],
    keyPlaceholder: 'xai-...',
    consoleUrl: 'https://console.x.ai/',
  },
  cohere: {
    name: 'Cohere',
    badge: 'Enterprise NLP',
    defaultModel: 'command-r-plus',
    models: ['command-r-plus', 'command-r', 'command-light'],
    keyPlaceholder: '...',
    consoleUrl: 'https://dashboard.cohere.com/api-keys',
  },
  perplexity: {
    name: 'Perplexity AI',
    badge: 'Web Grounded',
    defaultModel: 'sonar',
    models: ['sonar', 'sonar-pro', 'sonar-reasoning'],
    keyPlaceholder: 'pplx-...',
    consoleUrl: 'https://www.perplexity.ai/settings/api',
  },
  ollama: {
    name: 'Ollama (Local / Self-Hosted)',
    badge: '100% Offline / Private',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'deepseek-r1', 'mistral', 'qwen2.5', 'llama3.1'],
    keyPlaceholder: 'Optional (e.g. ollama-local)',
    consoleUrl: 'https://ollama.com/',
    defaultBaseUrl: 'http://localhost:11434',
  },
};

export interface SaasPlanConfig {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  stripeMonthlyPlanId?: string;
  stripeAnnualPlanId?: string;
  paystackMonthlyPlanCode?: string;
  paystackAnnualPlanCode?: string;
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
  const { formatNumber, formatCurrency, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'plans' | 'cms' | 'orgs' | 'settings'>('overview');

  useEffect(() => {
    if (tabParam === 'setup' || tabParam === 'plans' || tabParam === 'cms' || tabParam === 'orgs' || tabParam === 'settings' || tabParam === 'overview') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: 'overview' | 'setup' | 'plans' | 'cms' | 'orgs' | 'settings') => {
    setActiveTab(newTab);
    router.push(`/dashboard/admin?tab=${newTab}`);
  };

  const [plans, setPlans] = useState<SaasPlanConfig[]>(initialPlans);
  const [isSaving, setIsSaving] = useState(false);

  // Landing Page CMS State
  const [heroHeading, setHeroHeading] = useState('Precision Poultry Farm Management Platform');
  const [heroSubtitle, setHeroSubtitle] = useState('Empower farm managers with operational telemetry to track flock health, predict egg yields, and execute at peak efficiency.');
  const [announcementBanner, setAnnouncementBanner] = useState('New Release: Voice Auto-Logger & Multi-Farm Enterprise Hub live now');
  const [supportPhone, setSupportPhone] = useState('+234 800 768 5879');
  const [supportEmail, setSupportEmail] = useState('support@pfms-poultry.com');

  // Platform Brand Identity & Super Admin Credentials
  const [platformName, setPlatformName] = useState('PFMS');
  const [brandTagline, setBrandTagline] = useState('Smart Poultry Operating System');
  const [brandLogoText, setBrandLogoText] = useState('P');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [accentColor, setAccentColor] = useState('#7c3aed');
  const [footerText, setFooterText] = useState('PFMS Inc. All rights reserved.');
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [superAdminEmailState, setSuperAdminEmailState] = useState(currentUserEmail || 'owner@poultry.com');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fromEmail, setFromEmail] = useState('support@pfms-poultry.com');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        toast.success('Logo uploaded! Click "Publish Landing CMS & Brand" to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Tenant Management & Impersonation State
  const [orgsList, setOrgsList] = useState<any[]>(allOrgs);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [tenantDetail, setTenantDetail] = useState<any | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(false);
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    name: '',
    adminEmail: '',
    adminName: '',
    password: '',
    packageId: 'free',
    branchName: 'Main Branch'
  });

  // Merchant Payment Gateways
  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [showPaystackSecret, setShowPaystackSecret] = useState(false);

  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  // Email Notification Gateway
  const [resendApiKey, setResendApiKey] = useState('');
  const [showResendKey, setShowResendKey] = useState(false);

  // Artificial Intelligence (AI) Gateway
  const [aiProvider, setAiProvider] = useState<string>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [showAiSecret, setShowAiSecret] = useState(false);

  // System Versioning & Upgrade State
  const [versionInfo, setVersionInfo] = useState<{
    currentVersion: string;
    installedVersion: string;
    updateAvailable: boolean;
  }>({
    currentVersion: '2.4.0',
    installedVersion: '2.4.0',
    updateAvailable: false,
  });
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Fetch Version Status from /api/admin/upgrade
  const loadVersionInfo = async () => {
    try {
      const res = await fetch('/api/admin/upgrade');
      if (res.ok) {
        const data = await res.json();
        setVersionInfo({
          currentVersion: data.currentVersion || '2.4.0',
          installedVersion: data.installedVersion || '2.4.0',
          updateAvailable: Boolean(data.updateAvailable),
        });
      }
    } catch (_e) {}
  };

  // Run System Upgrade
  const handleRunUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/admin/upgrade', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success(data.message || `System upgraded to v${data.currentVersion} successfully!`);
        setVersionInfo({
          currentVersion: data.currentVersion,
          installedVersion: data.installedVersion,
          updateAvailable: false,
        });
        loadGatewayParams();
      } else {
        toast.error(data.error || 'System upgrade failed');
      }
    } catch (_err) {
      toast.error('Network error during system upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Load Gateway & Platform Parameters
  const loadGatewayParams = async () => {
    try {
      const res = await fetch('/api/admin/gateways');
      if (res.ok) {
        const data = await res.json();
        if (data.superAdminEmail) setSuperAdminEmailState(data.superAdminEmail);
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
          if (g.aiProvider) setAiProvider(g.aiProvider);
          if (g.aiApiKey) setAiApiKey(g.aiApiKey);
          if (g.aiModel) setAiModel(g.aiModel);
          if (g.aiBaseUrl) setAiBaseUrl(g.aiBaseUrl);
        }
      }
    } catch (_e) {}
  };

  useEffect(() => {
    loadGatewayParams();
    loadVersionInfo();

    // Fetch CMS Content
    fetch('/api/admin/cms')
      .then(res => res.json())
      .then(data => {
        if (data.brandName) setPlatformName(data.brandName);
        if (data.brandTagline) setBrandTagline(data.brandTagline);
        if (data.brandLogoText) setBrandLogoText(data.brandLogoText);
        if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl || '');
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.accentColor) setAccentColor(data.accentColor);
        if (data.footerText) setFooterText(data.footerText);
        if (data.heroHeading) setHeroHeading(data.heroHeading);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
        if (data.announcementBanner) setAnnouncementBanner(data.announcementBanner);
        if (data.supportPhone) setSupportPhone(data.supportPhone);
        if (data.supportEmail) setSupportEmail(data.supportEmail);
      })
      .catch(() => {});
  }, []);

  // Save Gateway Parameters via POST /api/admin/gateways
  const handleSaveGateways = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName,
          currencySymbol,
          superAdminEmail: superAdminEmailState,
          superAdminPassword: superAdminPassword || undefined,
          paystackPublicKey,
          paystackSecretKey,
          stripePublicKey,
          stripeSecretKey,
          stripeWebhookSecret,
          resendApiKey,
          fromEmail,
          aiProvider,
          aiApiKey,
          aiModel,
          aiBaseUrl,
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Payment gateways & settings saved successfully!');
        setSuperAdminPassword('');
        loadGatewayParams();
      } else {
        toast.error(data.error || 'Failed to save gateway settings');
      }
    } catch (_e) {
      toast.error('Error saving gateway configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Plan Handlers
  const handleFieldChange = (planId: string, field: keyof SaasPlanConfig, value: any) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const handleAddPlan = () => {
    const newId = `custom_${Date.now().toString().slice(-4)}`;
    const newPlan: SaasPlanConfig = {
      id: newId,
      name: 'Custom Tier',
      description: 'Custom tier tailored for specialized poultry operations.',
      priceMonthly: 25000,
      priceAnnual: 240000,
      stripeMonthlyPlanId: '',
      stripeAnnualPlanId: '',
      paystackMonthlyPlanCode: '',
      paystackAnnualPlanCode: '',
      maxBranches: 3,
      cctvEnabled: false,
      aiLoggerEnabled: true,
      exportReportsEnabled: true,
      enterpriseHubEnabled: false,
      features: [
        'Up to 3 Regional Farm Branches',
        'AI Voice Auto-Logger Integration',
        'Production Performance Telemetry'
      ]
    };
    setPlans(prev => [...prev, newPlan]);
    toast.success('New package added to draft. Click "Save All SaaS Plans" to publish.');
  };

  const handleDeletePlan = (planId: string) => {
    if (planId === 'free') {
      toast.error('The default Free Starter plan cannot be deleted.');
      return;
    }
    const target = plans.find(p => p.id === planId);
    if (window.confirm(`Are you sure you want to delete "${target?.name || planId}"?`)) {
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success('Plan removed from draft. Click "Save All SaaS Plans" to apply.');
    }
  };

  const handleAddFeature = (planId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return { ...p, features: [...(p.features || []), 'New feature entitlement'] };
      }
      return p;
    }));
  };

  const handleUpdateFeature = (planId: string, index: number, value: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const feats = [...(p.features || [])];
        feats[index] = value;
        return { ...p, features: feats };
      }
      return p;
    }));
  };

  const handleRemoveFeature = (planId: string, index: number) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const feats = [...(p.features || [])];
        feats.splice(index, 1);
        return { ...p, features: feats };
      }
      return p;
    }));
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
        toast.success(data.message || 'SaaS plans updated successfully!');
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (_err) {
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
          brandName: platformName,
          brandTagline,
          brandLogoText,
          logoUrl,
          primaryColor,
          accentColor,
          footerText,
          heroHeading,
          heroSubtitle,
          announcementBanner,
          supportPhone,
          supportEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Landing Page CMS & Brand Identity saved & published live!');
      } else {
        toast.error(data.error || 'Failed to save CMS');
      }
    } catch {
      toast.error('Error saving CMS content');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Tenant Details Drawer/Modal
  const handleViewTenant = async (org: any) => {
    setSelectedTenant({ ...org });
    setIsLoadingTenant(true);
    try {
      const res = await fetch(`/api/admin/tenants?id=${encodeURIComponent(org.id)}`);
      if (res.ok) {
        const data = await res.json();
        setTenantDetail(data);
      } else {
        toast.error('Could not load tenant details');
      }
    } catch {
      toast.error('Error fetching tenant telemetry');
    } finally {
      setIsLoadingTenant(false);
    }
  };

  // Save Tenant Update
  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;
    setIsSavingTenant(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: selectedTenant.id,
          name: selectedTenant.name,
          subscriptionTier: selectedTenant.subscriptionTier,
          subscriptionStatus: selectedTenant.subscriptionStatus
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Tenant updated successfully');
        setOrgsList(prev => prev.map(o => o.id === selectedTenant.id ? { ...o, ...selectedTenant } : o));
      } else {
        toast.error(data.error || 'Failed to update tenant');
      }
    } catch {
      toast.error('Error updating tenant');
    } finally {
      setIsSavingTenant(false);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Tenant deleted');
        setOrgsList(prev => prev.filter(o => o.id !== id));
        if (selectedTenant?.id === id) {
          setSelectedTenant(null);
          setTenantDetail(null);
        }
      } else {
        toast.error(data.error || 'Failed to delete tenant');
      }
    } catch {
      toast.error('Error deleting tenant');
    }
  };

  // Impersonate Tenant
  const handleImpersonateTenant = async (id: string, name: string) => {
    try {
      const toastId = toast.loading(`Logging in as ${name}...`);
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impersonate', id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Switched to tenant session!', { id: toastId });
        window.location.href = data.redirectUrl || '/dashboard';
      } else {
        toast.error(data.error || 'Failed to login as tenant', { id: toastId });
      }
    } catch {
      toast.error('Error logging in as tenant');
    }
  };

  // Create New Tenant Account
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantForm.name.trim() || !newTenantForm.adminEmail.trim()) {
      toast.error('Please enter farm organization name and admin email');
      return;
    }
    setIsCreatingTenant(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...newTenantForm
        })
      });
      const data = await res.json();
      if (res.ok && data.tenant) {
        toast.success(data.message || 'Farm tenant account created!');
        setOrgsList(prev => [data.tenant, ...prev]);
        setShowCreateModal(false);
        setNewTenantForm({
          name: '',
          adminEmail: '',
          adminName: '',
          password: '',
          packageId: 'free',
          branchName: 'Main Branch'
        });
      } else {
        toast.error(data.error || 'Failed to create farm tenant');
      }
    } catch {
      toast.error('Error creating farm tenant');
    } finally {
      setIsCreatingTenant(false);
    }
  };

  const totalRevenue = allHistory.reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const activeProCount = allOrgs.filter(o => o.subscriptionTier === 'pro').length;
  const activeEnterpriseCount = allOrgs.filter(o => o.subscriptionTier === 'enterprise' || o.subscriptionTier === 'entrepreneur').length;
  const activePaidSubsCount = allSubscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length || (activeProCount + activeEnterpriseCount);

  return (
    <div className="w-full space-y-6 pb-16 font-sans">
      {/* Compact & Responsive System Upgrade Alert Banner */}
      {versionInfo.updateAvailable && (
        <div className="border border-amber-300 bg-amber-50/95 px-3 sm:px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <RefreshCw className={`text-amber-600 shrink-0 ${isUpgrading ? 'animate-spin' : ''}`} size={16} />
            <div className="min-w-0 truncate">
              <span className="font-bold text-amber-950">Upgrade Available: </span>
              <span className="text-amber-900 font-medium">v{versionInfo.installedVersion} → v{versionInfo.currentVersion} (DB migrations ready).</span>
            </div>
          </div>
          <button
            onClick={handleRunUpgrade}
            disabled={isUpgrading}
            className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-3 py-1 rounded-xl shrink-0 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={12} className={isUpgrading ? 'animate-spin' : ''} />
            <span>{isUpgrading ? 'Upgrading…' : 'Run Upgrade'}</span>
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-purple-900 flex items-center justify-between">
                  <span>Monthly Recurring Revenue</span>
                  <DollarSign size={18} className="text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-purple-950">
                  {formatCurrency(totalRevenue, currencySymbol)}
                </div>
                <p className="text-xs text-purple-700 font-medium mt-1">Aggregated merchant subscriptions</p>
              </CardContent>
            </Card>

            <Card className="border border-indigo-200 bg-indigo-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                  <span>Farm Workspaces</span>
                  <Building2 size={18} className="text-indigo-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-indigo-950">{formatNumber(allOrgs.length)}</div>
                <p className="text-xs text-indigo-700 font-medium mt-1">
                  Pro: {formatNumber(activeProCount)} | Enterprise: {formatNumber(activeEnterpriseCount)}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200 bg-emerald-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                  <span>Active Subscriptions</span>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-950">
                  {formatNumber(activePaidSubsCount)}
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-1">Paid accounts on live billing</p>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>Platform Brand Title</span>
                  <ShieldCheck size={18} className="text-amber-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-amber-950 truncate">{platformName}</div>
                <p className="text-xs text-amber-700 font-medium mt-1">Currency: {currencySymbol}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Summary of Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Farm Workspaces Directory</h3>
            <p className="text-xs text-slate-500">
              Manage your tenants, inspect real-time billing history, and configure SaaS subscription tiers from the sidebar menu.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Workspaces</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">{formatNumber(allOrgs.length)}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">SaaS Packages Active</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">{formatNumber(plans.length)}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">System Status</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Operational
                </span>
              </div>
            </div>
          </div>

          {/* Recent Farm Workspaces & Direct Quick Access */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-purple-600" /> Recent Farm Workspaces
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick oversight of latest customer farm deployments and tenants</p>
              </div>
              <button
                onClick={() => handleTabChange('orgs')}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({allOrgs.length})</span>
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-4">Farm Workspace</th>
                    <th className="p-4">Owner / Admin</th>
                    <th className="p-4">Plan Tier</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {orgsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No farm workspaces registered yet.
                      </td>
                    </tr>
                  ) : (
                    orgsList.slice(0, 5).map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                              {org.name ? org.name.charAt(0).toUpperCase() : 'F'}
                            </div>
                            <div>
                              <div>{org.name}</div>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {org.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-800">{org.ownerUsername || 'System Admin'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{org.ownerEmail || 'admin@farm.local'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            org.subscriptionTier === 'enterprise' || org.subscriptionTier === 'entrepreneur'
                              ? 'bg-purple-100 text-purple-800'
                              : org.subscriptionTier === 'pro'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {org.subscriptionTier || 'Free'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            org.subscriptionStatus === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {org.subscriptionStatus || 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleImpersonateTenant(org.id, org.name)}
                            className="text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <LogIn size={13} /> Login as Tenant
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT & API GATEWAYS (Setup) */}
      {activeTab === 'setup' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Settings size={20} className="text-purple-600" /> Payment & API Gateways
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Configure merchant keys, billing webhooks, email delivery, and platform currency. Database parameters are locked to ensure security.
              </p>
            </div>

            <button
              onClick={handleSaveGateways}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
              <span>Save Gateway Settings</span>
            </button>
          </div>

          {/* Master Super Admin Credentials */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm w-full">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Lock size={16} className="text-indigo-600" /> Master Super Admin Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Super Admin Email</label>
                <input
                  type="email"
                  value={superAdminEmailState}
                  onChange={(e) => setSuperAdminEmailState(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Update Password (Optional)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 pr-10 text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white"
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Payment Gateways: Paystack & Stripe */}
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Paystack Public Key</label>
                <input
                  type="text"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-emerald-800 bg-slate-50 focus:bg-white"
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Paystack Secret Key</label>
                <input
                  type={showPaystackSecret ? 'text' : 'password'}
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-emerald-800 bg-slate-50 focus:bg-white"
                  placeholder="sk_live_..."
                />
              </div>
            </div>

            {/* Stripe Gateway */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-indigo-600" /> Stripe Merchant Keys (USD / Global)
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Stripe Publishable Key</label>
                <input
                  type="text"
                  value={stripePublicKey}
                  onChange={(e) => setStripePublicKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-indigo-800 bg-slate-50 focus:bg-white"
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Stripe Secret Key</label>
                <input
                  type={showStripeSecret ? 'text' : 'password'}
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-indigo-800 bg-slate-50 focus:bg-white"
                  placeholder="sk_live_..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Stripe Webhook Signing Secret</label>
                <input
                  type={showStripeSecret ? 'text' : 'password'}
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-indigo-800 bg-slate-50 focus:bg-white"
                  placeholder="whsec_..."
                />
              </div>
            </div>
          </div>

          {/* Email Gateway */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Mail size={16} className="text-purple-600" /> Transactional Email Gateway (Resend)
              </h3>
              <button
                type="button"
                onClick={() => setShowResendKey(!showResendKey)}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showResendKey ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showResendKey ? 'Hide Key' : 'Show Key'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resend API Key</label>
                <input
                  type={showResendKey ? 'text' : 'password'}
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-purple-900 bg-slate-50 focus:bg-white"
                  placeholder="re_..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">From Sender Email</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Artificial Intelligence (AI) Gateway */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Bot size={18} className="text-indigo-600" /> Artificial Intelligence (AI) Gateway
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select your preferred LLM provider and enter your API key to power the Voice & Quick Text Auto-Logger.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 whitespace-nowrap">
                  <Cpu size={12} />
                  Active: {AI_PRESETS[aiProvider]?.name || 'Google Gemini'} {AI_PRESETS[aiProvider]?.badge && `(${AI_PRESETS[aiProvider].badge})`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiSecret(!showAiSecret)}
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  {showAiSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showAiSecret ? 'Hide Key' : 'Show Key'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    const newProvider = e.target.value as any;
                    setAiProvider(newProvider);
                    if (AI_PRESETS[newProvider]) {
                      setAiModel(AI_PRESETS[newProvider].defaultModel);
                      if (AI_PRESETS[newProvider].defaultBaseUrl) {
                        setAiBaseUrl(AI_PRESETS[newProvider].defaultBaseUrl!);
                      }
                    }
                  }}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white"
                >
                  <option value="gemini">Google Gemini (Recommended / Ultra-Fast)</option>
                  <option value="openai">OpenAI (ChatGPT / GPT-4o / GPT-4o-mini)</option>
                  <option value="groq">Groq Cloud (Llama 3.3 / Instant Inference)</option>
                  <option value="deepseek">DeepSeek AI (DeepSeek-V3 / Economical)</option>
                  <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                  <option value="openrouter">OpenRouter (200+ Unified Models Hub)</option>
                  <option value="mistral">Mistral AI (Mistral Small / Large)</option>
                  <option value="xai">xAI Grok (Grok-Beta / Grok-2)</option>
                  <option value="cohere">Cohere (Command R+)</option>
                  <option value="perplexity">Perplexity AI (Sonar / Web Grounded)</option>
                  <option value="ollama">Ollama (Local / Self-Hosted Offline)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Model ID</span>
                  <span className="text-[10px] text-slate-400 font-normal">Preset or custom</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={aiModel || (AI_PRESETS[aiProvider]?.defaultModel || '')}
                    onChange={(e) => setAiModel(e.target.value)}
                    list="ai-model-options"
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono font-medium text-slate-800 bg-slate-50 focus:bg-white"
                    placeholder={AI_PRESETS[aiProvider]?.defaultModel || 'Model identifier'}
                  />
                  <datalist id="ai-model-options">
                    {AI_PRESETS[aiProvider]?.models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>API Key</span>
                  {AI_PRESETS[aiProvider]?.consoleUrl && (
                    <a
                      href={AI_PRESETS[aiProvider].consoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>Get API Key</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </label>
                <input
                  type={showAiSecret ? 'text' : 'password'}
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-mono text-purple-900 bg-slate-50 focus:bg-white"
                  placeholder={AI_PRESETS[aiProvider]?.keyPlaceholder || 'Enter API Key...'}
                />
              </div>
            </div>

            {/* Optional Custom Base URL for Local Ollama or Private Proxy */}
            {aiProvider === 'ollama' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Local / Self-Hosted Server Endpoint</span>
                  <span className="text-[10px] text-slate-400">Default: http://localhost:11434</span>
                </label>
                <input
                  type="text"
                  value={aiBaseUrl}
                  onChange={(e) => setAiBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 bg-white outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Connects to your local Ollama daemon or vLLM / LiteLLM server over LAN or localhost.
                </p>
              </div>
            )}

            <div className="p-3 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/70 border border-purple-100 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600">
              <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-bold">Zero-Downtime Smart Fallback: </strong>
                If the selected provider is unreachable, out of credits, or no API key is specified, the system automatically falls back to the built-in offline smart poultry rule parser with 100% continuous uptime.
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveGateways}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save & Apply Gateway Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SAAS PLANS (Dynamic Packages & Entitlements) */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers size={20} className="text-purple-600" /> SaaS Plans
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                Create, rename, configure, and delete subscription tiers. Link Stripe Plan IDs & Paystack Plan Codes for automated recurring merchant billing.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleAddPlan}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>Add New Package</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllPlans}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
                <span>Save All SaaS Plans</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-2 border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                <CardHeader className="bg-slate-50/80 border-b border-slate-200 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-extrabold">
                      ID: {plan.id}
                    </span>
                    {plan.id !== 'free' && (
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Package Name
                    </label>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => handleFieldChange(plan.id, 'name', e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-900 bg-white focus:border-indigo-500"
                      placeholder="e.g. Commercial Pro"
                    />
                  </div>

                  <div className="mt-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={plan.description}
                      onChange={(e) => handleFieldChange(plan.id, 'description', e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 bg-white focus:border-indigo-500"
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Monthly ({currencySymbol})</label>
                      <input
                        type="number"
                        value={plan.priceMonthly}
                        onChange={(e) => handleFieldChange(plan.id, 'priceMonthly', Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-extrabold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Annual ({currencySymbol})</label>
                      <input
                        type="number"
                        value={plan.priceAnnual}
                        onChange={(e) => handleFieldChange(plan.id, 'priceAnnual', Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-extrabold bg-white"
                      />
                    </div>
                  </div>

                  {/* Stripe Plan / Price IDs */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={13} className="text-indigo-600" /> Stripe Plan Price IDs
                    </span>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={plan.stripeMonthlyPlanId || ''}
                        onChange={(e) => handleFieldChange(plan.id, 'stripeMonthlyPlanId', e.target.value)}
                        placeholder="Monthly Price ID (price_1N...)"
                        className="w-full border border-slate-200 rounded-lg p-2 text-[11px] font-mono bg-white"
                      />
                      <input
                        type="text"
                        value={plan.stripeAnnualPlanId || ''}
                        onChange={(e) => handleFieldChange(plan.id, 'stripeAnnualPlanId', e.target.value)}
                        placeholder="Annual Price ID (price_1N...)"
                        className="w-full border border-slate-200 rounded-lg p-2 text-[11px] font-mono bg-white"
                      />
                    </div>
                  </div>

                  {/* Paystack Plan Codes */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={13} className="text-emerald-600" /> Paystack Plan Codes
                    </span>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={plan.paystackMonthlyPlanCode || ''}
                        onChange={(e) => handleFieldChange(plan.id, 'paystackMonthlyPlanCode', e.target.value)}
                        placeholder="Monthly Plan Code (PLN_...)"
                        className="w-full border border-slate-200 rounded-lg p-2 text-[11px] font-mono bg-white"
                      />
                      <input
                        type="text"
                        value={plan.paystackAnnualPlanCode || ''}
                        onChange={(e) => handleFieldChange(plan.id, 'paystackAnnualPlanCode', e.target.value)}
                        placeholder="Annual Plan Code (PLN_...)"
                        className="w-full border border-slate-200 rounded-lg p-2 text-[11px] font-mono bg-white"
                      />
                    </div>
                  </div>

                  {/* Entitlements & Feature Toggles */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-xs font-bold text-slate-700">Max Branches Allowed</label>
                      <input
                        type="number"
                        value={plan.maxBranches}
                        onChange={(e) => handleFieldChange(plan.id, 'maxBranches', Number(e.target.value))}
                        className="w-20 border-2 border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold bg-white"
                      />
                    </div>

                    <div className="space-y-2 text-xs font-semibold text-slate-700">
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
                  </div>

                  {/* Bullet Points Feature List */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Feature Bullet Points
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddFeature(plan.id)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add Bullet</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(plan.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => handleUpdateFeature(plan.id, idx, e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-800 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(plan.id, idx)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer shrink-0"
                            title="Remove bullet"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles size={20} className="text-purple-600" /> Public Landing Page Content Editor
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                Edit public hero headlines, announcement banners, and support contact details live on your homepage.
              </p>
            </div>

            <button
              onClick={handleSaveCms}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
              <span>Publish Landing CMS & Brand</span>
            </button>
          </div>

          {/* BRAND IDENTITY & WHITE-LABEL CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Platform Brand Identity & White-Label
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the platform brand name, monogram badge, currency, and footer across all public and farm pages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand / Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="e.g. PFMS, PoultryOS"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-bold text-indigo-700 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand Logo Badge (1-3 Letters)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={brandLogoText}
                  onChange={(e) => setBrandLogoText(e.target.value)}
                  placeholder="e.g. P"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-extrabold text-slate-900 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none uppercase text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Platform Currency</label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-extrabold text-emerald-700 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
                >
                  <option value="₦">₦ - Nigerian Naira (NGN)</option>
                  <option value="$">$ - US Dollar (USD)</option>
                  <option value="€">€ - Euro (EUR)</option>
                  <option value="£">£ - British Pound (GBP)</option>
                  <option value="KSh">KSh - Kenyan Shilling (KES)</option>
                  <option value="GH₵">GH₵ - Ghanaian Cedi (GHS)</option>
                  <option value="CFA">CFA - West African Franc (XOF)</option>
                  <option value="R">R - South African Rand (ZAR)</option>
                  <option value="UGX">UGX - Ugandan Shilling (UGX)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand Tagline / Slogan</label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="e.g. Smart Poultry Operating System"
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Footer Copyright Line</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="e.g. PFMS Inc. All rights reserved."
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* LOGO UPLOAD & BRAND COLORS ROW */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand Logo Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Brand Logo Image (PNG, JPG, SVG, WebP)
                </label>
                
                {logoUrl ? (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="h-14 w-28 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Brand Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">Custom Logo Uploaded</p>
                      <div className="flex items-center gap-2">
                        <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                          Change Logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setLogoUrl(''); toast.success('Logo removed, falling back to logo badge'); }}
                          className="text-red-500 hover:text-red-700 text-[11px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl cursor-pointer transition-colors">
                    <Upload size={20} className="text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800">Upload Brand Logo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG up to 2MB</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Brand Colors Config */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Brand Colors (Primary & Accent)
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Primary Color */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600">Primary Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold uppercase bg-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600">Accent Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold uppercase bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                  {[
                    { name: 'Indigo', prim: '#4f46e5', acc: '#7c3aed' },
                    { name: 'Emerald', prim: '#059669', acc: '#10b981' },
                    { name: 'Navy', prim: '#1e3a8a', acc: '#3b82f6' },
                    { name: 'Amber', prim: '#d97706', acc: '#f59e0b' },
                    { name: 'Rose', prim: '#e11d48', acc: '#f43f5e' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => { setPrimaryColor(preset.prim); setAccentColor(preset.acc); }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.prim }} />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Hero Headline</label>
              <input
                type="text"
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Hero Subtitle</label>
              <textarea
                rows={3}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Top Announcement Banner</label>
              <input
                type="text"
                value={announcementBanner}
                onChange={(e) => setAnnouncementBanner(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Support Phone</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Support Email</label>
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
      )}

      {/* TAB 5: TENANT ORGANIZATIONS */}
      {activeTab === 'orgs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 size={20} className="text-purple-600" /> Registered Farm Tenant Accounts ({formatNumber(orgsList.length)})
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                Directory of all customer and internal farm organizations. Manage subscriptions, view deep telemetry, or log in to manage/subscribe on their behalf.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <UserPlus size={16} />
              <span>Create Farm Account</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-4">Farm Organization</th>
                    <th className="p-4">Owner / Admin</th>
                    <th className="p-4">Subscription Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {orgsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No organization workspaces registered yet. Click &quot;Create Farm Account&quot; to provision a farm.
                      </td>
                    </tr>
                  ) : (
                    orgsList.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {org.name ? org.name.charAt(0).toUpperCase() : 'F'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">{org.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{org.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-xs text-slate-800 font-medium">{org.ownerEmail || 'admin@poultry.local'}</p>
                          {org.ownerUsername && (
                            <p className="text-[10px] text-slate-400">User: @{org.ownerUsername}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded capitalize">
                            {org.subscriptionTier || 'Free Starter'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded capitalize ${
                            org.subscriptionStatus === 'active' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : org.subscriptionStatus === 'suspended'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {org.subscriptionStatus || 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewTenant(org)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                            >
                              <Activity size={13} className="text-indigo-600" />
                              <span>Manage</span>
                            </button>

                            <button
                              onClick={() => handleImpersonateTenant(org.id, org.name)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
                              title="Login into customer farm account"
                            >
                              <LogIn size={13} />
                              <span>Login as Farm</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL 1: CREATE FARM TENANT */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Provision New Farm Tenant Account</h3>
                      <p className="text-xs text-slate-500">Create a farm account for yourself or a customer.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunrise Agro Farms"
                      value={newTenantForm.name}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Green"
                        value={newTenantForm.adminName}
                        onChange={(e) => setNewTenantForm({ ...newTenantForm, adminName: e.target.value })}
                        className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-xs font-medium bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@sunrise.com"
                        value={newTenantForm.adminEmail}
                        onChange={(e) => setNewTenantForm({ ...newTenantForm, adminEmail: e.target.value })}
                        className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-xs font-medium bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                      <input
                        type="text"
                        placeholder="FarmAdmin123!"
                        value={newTenantForm.password}
                        onChange={(e) => setNewTenantForm({ ...newTenantForm, password: e.target.value })}
                        className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-xs font-mono bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Branch Name</label>
                      <input
                        type="text"
                        placeholder="Main Branch"
                        value={newTenantForm.branchName}
                        onChange={(e) => setNewTenantForm({ ...newTenantForm, branchName: e.target.value })}
                        className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-xs font-medium bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assign SaaS Package Tier</label>
                    <select
                      value={newTenantForm.packageId}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, packageId: e.target.value })}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.priceMonthly === 0 ? 'Free' : `${formatCurrency(p.priceMonthly, currencySymbol)}/mo`}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Includes all custom private packages configured in the SaaS plans catalog.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingTenant}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      {isCreatingTenant ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                      <span>Provision Farm Account</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: TENANT DETAILS & MANAGEMENT */}
          {selectedTenant && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 font-sans">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{selectedTenant.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">Org ID: {selectedTenant.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedTenant(null); setTenantDetail(null); }}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Telemetry Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                      <p className="text-[10px] text-purple-600 font-bold uppercase">Branches</p>
                      <p className="text-xl font-extrabold text-purple-900 mt-0.5">
                        {isLoadingTenant ? '...' : (tenantDetail?.workspaces?.length || 1)}
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                      <p className="text-[10px] text-indigo-600 font-bold uppercase">Staff</p>
                      <p className="text-xl font-extrabold text-indigo-900 mt-0.5">
                        {isLoadingTenant ? '...' : (tenantDetail?.telemetry?.staffCount || 0)}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                      <p className="text-[10px] text-amber-600 font-bold uppercase">Flocks</p>
                      <p className="text-xl font-extrabold text-amber-900 mt-0.5">
                        {isLoadingTenant ? '...' : (tenantDetail?.telemetry?.batchesCount || 0)}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Good Eggs</p>
                      <p className="text-xl font-extrabold text-emerald-900 mt-0.5">
                        {isLoadingTenant ? '...' : formatNumber(tenantDetail?.telemetry?.eggsCount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Editable Configuration */}
                  <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Farm Workspace Configuration</h4>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
                      <input
                        type="text"
                        value={selectedTenant.name}
                        onChange={(e) => setSelectedTenant({ ...selectedTenant, name: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Package Tier</label>
                        <select
                          value={selectedTenant.subscriptionTier || 'free'}
                          onChange={(e) => setSelectedTenant({ ...selectedTenant, subscriptionTier: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-purple-900 bg-white cursor-pointer capitalize"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.priceMonthly === 0 ? 'Free' : `${formatCurrency(p.priceMonthly, currencySymbol)}/mo`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Status</label>
                        <select
                          value={selectedTenant.subscriptionStatus || 'active'}
                          onChange={(e) => setSelectedTenant({ ...selectedTenant, subscriptionStatus: e.target.value })}
                          className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-emerald-900 bg-white cursor-pointer capitalize"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Branches Matrix */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Associated Farm Workspaces</h4>
                    <div className="space-y-1.5">
                      {tenantDetail?.workspaces?.length > 0 ? (
                        tenantDetail.workspaces.map((ws: any) => (
                          <div key={ws.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{ws.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{ws.type || 'Layer Farm'}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">Main Branch Workspace</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      onClick={() => handleDeleteTenant(selectedTenant.id, selectedTenant.name)}
                      className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <Trash2 size={14} />
                      <span>Delete Farm Organization</span>
                    </button>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleImpersonateTenant(selectedTenant.id, selectedTenant.name)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <LogIn size={14} />
                        <span>Login as Tenant</span>
                      </button>

                      <button
                        onClick={handleUpdateTenant}
                        disabled={isSavingTenant}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        {isSavingTenant ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SYSTEM GOVERNANCE & BRAND IDENTITY */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Server size={20} className="text-purple-600" /> Platform Maintenance & System Governance
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Global system diagnostics, database schema integrity, brand identity overview, and maintenance shortcuts.
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h4 className="font-bold text-xs text-slate-900">Platform Brand Identity</h4>
                <p className="text-sm font-extrabold text-indigo-700">{platformName}</p>
                <p className="text-[11px] text-slate-500">{brandTagline}</p>
                <button
                  onClick={() => setActiveTab('cms')}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                >
                  Edit Brand in CMS →
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h4 className="font-bold text-xs text-slate-900">Database Driver Engine</h4>
                <p className="text-xs text-slate-600 font-mono">
                  Engine: Managed Database Service
                </p>
                <p className="text-xs text-emerald-700 font-bold">Status: Healthy & Active</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h4 className="font-bold text-xs text-slate-900">Deployment Environment</h4>
                <p className="text-xs text-slate-600 font-mono">Node.js Next.js 16 (Production)</p>
                <p className="text-xs text-indigo-700 font-bold">Mode: Production Self-Hosted</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
