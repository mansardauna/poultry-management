'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertSettings } from "@/data/types";
import { 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Button as MuiButton,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Settings, BellRing, User, DollarSign, Trash2, CheckCircle2, Shield, CreditCard, Download, X, Sparkles, Star, Plus, Zap } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';

/**
 * Represents a workspace.
 */
interface Workspace {
  id: string;
  name: string;
  type: string;
}

/**
 * Represents the shape of system-level settings stored in the database.
 */
interface SystemSettings {
  id?: string;
  farmName?: string;
  billingRegion?: string;
  eggCratePriceSmall?: number;
  eggCratePriceLarge?: number;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

/**
 * Props for the SettingsClient component.
 */
interface SettingsClientProps {
  initialSettings: AlertSettings | undefined;
  systemSettings: SystemSettings | undefined;
  initialPaymentMethods?: any[];
  initialSubscriptionHistory?: any[];
  workspaces: Workspace[];
  workspaceId: string;
}

/**
 * SettingsClient component for configuring platform settings.
 *
 * @param props - Component properties.
 */
export function SettingsClient({ initialSettings, systemSettings, initialPaymentMethods = [], initialSubscriptionHistory = [], workspaceId }: SettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'profile' | 'alerts' | 'gateways' | 'subscription'>(
    tabParam === 'subscription' || tabParam === 'billing' ? 'subscription' : 'subscription'
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');
  
  // Real Dynamic Payment Methods & Subscription History
  const [paymentMethods, setPaymentMethods] = useState<any[]>(initialPaymentMethods);
  const { activeWorkspace } = useWorkspace();
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>(initialSubscriptionHistory);

  // Add Card Modal State
  const [openAddCardModal, setOpenAddCardModal] = useState(false);
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('12');
  const [cardExpYear, setCardExpYear] = useState('2028');
  const [cardIsDefault, setCardIsDefault] = useState(true);

  const isUpgraded = searchParams.get('upgraded') === 'true';
  const queryTier = searchParams.get('tier');
  const [saasPlans, setSaasPlans] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSaasPlans(data);
      })
      .catch(() => {});
  }, []);

  const activePlan = saasPlans.find(p => p.id === currentTier);
  const proPlan = saasPlans.find(p => p.id === 'pro');
  const enterprisePlan = saasPlans.find(p => p.id === 'enterprise');

  useEffect(() => {
    const match = document.cookie.match(/pfms_tier=([^;]+)/);
    if (match) setCurrentTier(match[1]);

    if (isUpgraded && queryTier) {
      fetch('/api/checkout/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: queryTier, demo: true })
      }).then(res => res.json()).then(data => {
        if (data.tier) {
          setCurrentTier(data.tier);
          toast.success(`Subscription active! Upgraded to ${data.tier === 'enterprise' || data.tier === 'entrepreneur' ? 'Enterprise & Cooperative' : 'Commercial Pro'}.`, { id: 'settings-upgrade-toast' });
          router.refresh();
        }
      });
    }
  }, [isUpgraded, queryTier, router]);
  const [feedThresholdKg, setFeedThresholdKg] = useState(String(initialSettings?.feedThresholdKg || 50));
  const [eggDropPercentage, setEggDropPercentage] = useState(String(initialSettings?.eggDropPercentage || 15));
  const [notifySms, setNotifySms] = useState(initialSettings?.notifySms || false);
  const [notifyEmail, setNotifyEmail] = useState(initialSettings?.notifyEmail || false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(initialSettings?.notifyWhatsapp || false);

  // System Settings
  const computedFarmId = activeWorkspace?.id 
    ? `PFMS-ORG-${activeWorkspace.id.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase()}` 
    : 'PFMS-ORG-00001';

  const [eggCratePriceSmall, setEggCratePriceSmall] = useState(String(systemSettings?.eggCratePriceSmall || 4200));
  const [eggCratePriceLarge, setEggCratePriceLarge] = useState(String(systemSettings?.eggCratePriceLarge || 4400));
  const [farmName, setFarmName] = useState(systemSettings?.farmName || activeWorkspace?.name || 'My Poultry Farm');
  const [adminName, setAdminName] = useState(systemSettings?.adminName || '');
  const [adminEmail, setAdminEmail] = useState(systemSettings?.adminEmail || '');
  const [adminPhone, setAdminPhone] = useState(systemSettings?.adminPhone || '');
  const [billingRegion, setBillingRegion] = useState(systemSettings?.billingRegion || 'Nigeria & West Africa (NGN)');
  const [paystackPublicKey, setPaystackPublicKey] = useState(systemSettings?.paystackPublicKey || '');
  const [paystackSecretKey, setPaystackSecretKey] = useState(systemSettings?.paystackSecretKey || '');
  const [stripePublicKey, setStripePublicKey] = useState(systemSettings?.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  const [stripeSecretKey, setStripeSecretKey] = useState(systemSettings?.stripeSecretKey || '');
  const [flutterwavePublicKey, setFlutterwavePublicKey] = useState(systemSettings?.flutterwavePublicKey || '');
  const [flutterwaveSecretKey, setFlutterwaveSecretKey] = useState(systemSettings?.flutterwaveSecretKey || '');
  const [bankName, setBankName] = useState(systemSettings?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(systemSettings?.accountNumber || '');
  const [accountName, setAccountName] = useState(systemSettings?.accountName || '');

  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveAlertSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedThresholdKg: Number(feedThresholdKg),
          eggDropPercentage: Number(eggDropPercentage),
          notifySms,
          notifyEmail,
          notifyWhatsapp
        })
      });
      if (res.ok) {
        toast.success('Alert settings saved successfully!');
        router.refresh();
      }
      else toast.error('Failed to save alert settings');
    } catch (_err) {
      toast.error('Error saving settings');
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'system',
          id: systemSettings?.id,
          farmName,
          adminName,
          adminEmail,
          adminPhone,
          billingRegion,
          eggCratePriceSmall: Number(eggCratePriceSmall),
          eggCratePriceLarge: Number(eggCratePriceLarge),
          paystackPublicKey,
          paystackSecretKey,
          stripePublicKey,
          stripeSecretKey,
          flutterwavePublicKey,
          flutterwaveSecretKey,
          bankName,
          accountNumber,
          accountName
        })
      });
      if (res.ok) {
        toast.success('System & payment gateway settings saved!');
        router.refresh();
      }
      else toast.error('Failed to save system settings');
    } catch (_err) {
      toast.error('Error saving system settings');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (workspaceId === 'main') {
      toast.error("Cannot delete the main workspace.");
      return;
    }
    if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces?id=${workspaceId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Workspace deleted successfully');
        // Delete cookie and redirect
        document.cookie = "pfms_workspace=main; path=/; max-age=31536000";
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete workspace');
      }
    } catch (_error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (paymentMethods.length >= 3) {
      toast.error('Maximum 3 saved payment methods limit reached. Please remove an existing card to add a new one.');
      return;
    }
    const isDigitalWallet = cardBrand === 'Apple Pay' || cardBrand === 'Google Pay';
    const finalLast4 = isDigitalWallet && !cardLast4 ? (cardBrand === 'Apple Pay' ? 'APAY' : 'GPAY') : cardLast4;

    if (!finalLast4 || finalLast4.length < 4) {
      toast.error('Please enter card digits or select Apple/Google Pay');
      return;
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPaymentMethod',
          brand: cardBrand,
          last4: finalLast4,
          expMonth: Number(cardExpMonth) || 12,
          expYear: Number(cardExpYear) || 2028,
          isDefault: cardIsDefault || paymentMethods.length === 0
        })
      });
      const data = await res.json();
      if (res.ok && data.paymentMethod) {
        toast.success(`${cardBrand} saved as active payment method!`);
        setPaymentMethods(prev => cardIsDefault || prev.length === 0 ? [data.paymentMethod, ...prev.map(p => ({ ...p, isDefault: false }))] : [...prev, data.paymentMethod]);
        setOpenAddCardModal(false);
        setCardLast4('');
      } else {
        toast.error(data.error || 'Failed to save payment method');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      const res = await fetch(`/api/settings?id=${id}&type=paymentMethod`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Payment method removed.');
        setPaymentMethods(prev => prev.filter(p => p.id !== id));
      } else {
        toast.error('Failed to remove payment method');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleInitiateCheckout = async (planId: string, isAnnualCycle: boolean) => {
    try {
      toast.loading('Initiating checkout...', { id: 'chk-toast' });
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, isAnnual: isAnnualCycle })
      });
      const data = await res.json();
      toast.dismiss('chk-toast');
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to start checkout');
      }
    } catch (_e) {
      toast.dismiss('chk-toast');
      toast.error('An error occurred during checkout');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Settings size={32} className="text-indigo-600" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Settings & Subscription</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your billing plans, alert rules, and farm profile.</p>
          </div>
        </div>

        <button
          onClick={() => setShowUpgradeModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2"
        >
          <Sparkles size={16} /> Upgrade Plan
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('subscription')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'subscription' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={16} /> My Subscription & Billing
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={16} /> Farm Profile & Pricing
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'alerts' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BellRing size={16} /> Alert Rules
        </button>
        <button
          onClick={() => setActiveTab('gateways')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'gateways' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard size={16} /> Payment Gateway Keys
        </button>
      </div>

      {/* Tab 1: Subscription & Billing Dashboard (Inspired by Reference UI) */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Company Details Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{farmName || activeWorkspace?.name || 'My Poultry Farm'}</h2>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Billed Monthly
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Farm ID: {computedFarmId} | Account Admin: {adminName || 'Farm Owner'}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider">Account Admin</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{adminName || 'Farm Owner'}</p>
                  <p className="text-slate-500">{adminEmail || 'Not Configured'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{adminPhone || 'Not Configured'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase tracking-wider">Billing Region</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{billingRegion || 'Nigeria & West Africa (NGN)'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Plan Summary Box */}
          <Card className="border-2 border-indigo-200">
            <CardHeader className="border-b border-slate-100 bg-indigo-50/30">
              <CardTitle className="text-sm font-bold uppercase text-slate-800 flex items-center justify-between">
                <span>Current Active Subscription</span>
                <span className={`text-xs px-3 py-1 rounded-full font-extrabold uppercase ${
                  currentTier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                  currentTier === 'pro' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                }`}>
                  {currentTier === 'enterprise' ? 'Enterprise Cooperative' : currentTier === 'pro' ? 'Commercial Pro' : 'Free Starter'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ₦{((activePlan ? (isAnnual ? Math.round(activePlan.priceAnnual / 12) : activePlan.priceMonthly) : (currentTier === 'enterprise' ? 45000 : currentTier === 'pro' ? 15000 : 0))).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 max-w-lg leading-relaxed">
                    {currentTier === 'enterprise' 
                      ? 'Includes Multi-Farm Enterprise Hub, White-Label Cooperative Portal, 24/7 Consultant Support, Custom API & Logistics.'
                      : currentTier === 'pro'
                      ? 'Includes AI Voice Auto-Logger, CCTV Live Surveillance, PDF/Excel Exports, and Unlimited Branches & Staff.'
                      : 'Free Starter Plan includes up to 1 branch, 2 staff members, and basic flock logs.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl shadow-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {currentTier === 'free' ? 'Upgrade Plan' : 'Manage / Change Tier'}
                  </button>
                  {currentTier !== 'free' && (
                    <button
                      onClick={async () => {
                        if (confirm('Cancel your active subscription? Your account will downgrade to Free Starter.')) {
                          try {
                            toast.loading('Cancelling subscription...', { id: 'cancel-toast' });
                            const res = await fetch('/api/subscription/cancel', { method: 'POST' });
                            toast.dismiss('cancel-toast');
                            if (res.ok) {
                              document.cookie = "pfms_tier=free; path=/; max-age=86400";
                              setCurrentTier('free');
                              toast.success('Subscription cancelled successfully. Account downgraded to Free Starter.');
                            } else {
                              toast.error('Failed to cancel subscription');
                            }
                          } catch (_e) {
                            toast.dismiss('cancel-toast');
                            toast.error('Error cancelling subscription');
                          }
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs uppercase px-4 py-3 rounded-xl transition-colors cursor-pointer border border-red-200 whitespace-nowrap"
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Dynamic Payment Methods Card */}
          <Card>
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-600" /> Saved Payment Methods (Auto-Billing)
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">Save up to 3 cards or digital wallets. Active default method is auto-billed monthly.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {paymentMethods.length}/3 Saved
                </span>
                <button
                  disabled={paymentMethods.length >= 3}
                  onClick={() => setOpenAddCardModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add Payment Method
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Auto-Debit Active Status Banner */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Automated Recurring Subscription Active</h4>
                    <p className="text-[11px] text-slate-600">
                      Your default active card is set to automatically renew your subscription monthly. No manual payments required.
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-300 flex-shrink-0">
                  Auto-Renewal Active
                </span>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Saved Payment Methods</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                    Save up to 3 credit cards, Apple Pay, or Google Pay. The active card will auto-bill your subscription monthly.
                  </p>
                  <button 
                    onClick={() => setOpenAddCardModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Add Payment Method
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className={`border p-4 rounded-xl flex items-center justify-between ${
                      pm.isDefault ? 'border-emerald-300 bg-emerald-50/20 shadow-sm' : 'border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-8 rounded font-bold text-[10px] flex items-center justify-center uppercase text-white ${
                          pm.brand === 'Apple Pay' ? 'bg-black' : pm.brand === 'Google Pay' ? 'bg-blue-600' : 'bg-slate-900'
                        }`}>
                          {pm.brand || 'Card'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900">
                              {pm.brand || 'Card'} {pm.last4?.length === 4 && !pm.last4?.includes('PAY') ? `ending in •••• ${pm.last4}` : pm.last4}
                            </p>
                            {pm.isDefault && (
                              <span className="text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Active Auto-Debit Method
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Expires {String(pm.expMonth).padStart(2, '0')}/{String(pm.expYear).slice(-2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pm.isDefault ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                            Active Default
                          </span>
                        ) : (
                          <button 
                            onClick={async () => {
                              await fetch('/api/settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'addPaymentMethod', brand: pm.brand, last4: pm.last4, expMonth: pm.expMonth, expYear: pm.expYear, isDefault: true })
                              });
                              setPaymentMethods(prev => prev.map(p => ({ ...p, isDefault: p.id === pm.id })));
                              toast.success(`Set ${pm.brand} as active auto-debit method`);
                            }}
                            className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            Set as Active Method
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove payment method"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real Dynamic Subscription History Table */}
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
                <Download size={18} className="text-slate-600" /> Subscription History & Receipts
              </CardTitle>
            </CardHeader>
            <CardContent className={subscriptionHistory.length === 0 ? "p-6" : "p-0"}>
              {subscriptionHistory.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6">
                  <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Subscription History Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    You have no recorded plan transactions yet. Billing receipts and renewal invoices will appear here after your first plan upgrade.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                        <th className="p-4">Date</th>
                        <th className="p-4">Plan Tier</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Receipt</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {subscriptionHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="p-4">{new Date(item.createdAt || Date.now()).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-indigo-600">{item.planName || item.planId}</td>
                          <td className="p-4 font-mono font-bold text-slate-900">
                            {item.currency === 'USD' ? '$' : '₦'}{Number(item.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-4 font-mono text-slate-500">#{item.id.slice(-8)}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => toast.success('Downloading Official Receipt PDF...')}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 inline-flex cursor-pointer"
                            >
                              <Download size={12} /> PDF Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Profile & Pricing */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
              <User size={18} className="text-green-500" /> Farm Profile & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Farm / Organization Name" fullWidth variant="outlined" value={farmName} onChange={(e) => setFarmName(e.target.value)} helperText="Official farm name displayed on billing cards and invoices." />
              <TextField label="Admin Full Name" fullWidth variant="outlined" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
              <TextField label="Admin Email Address" type="email" fullWidth variant="outlined" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              <TextField label="Admin Contact Phone" fullWidth variant="outlined" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
              <TextField label="Billing Region / Currency" fullWidth variant="outlined" value={billingRegion} onChange={(e) => setBillingRegion(e.target.value)} helperText="e.g. Nigeria & West Africa (NGN)" />
              
              <div className="md:col-span-2 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-3 flex items-center gap-1">
                  <DollarSign size={14} /> Egg Pricing Configuration
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField label="Egg Price Per Crate (Small) - ₦" type="number" fullWidth variant="outlined" value={eggCratePriceSmall} onChange={(e) => setEggCratePriceSmall(e.target.value)} />
                  <TextField label="Egg Price Per Crate (Large) - ₦" type="number" fullWidth variant="outlined" value={eggCratePriceLarge} onChange={(e) => setEggCratePriceLarge(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <MuiButton onClick={handleSaveSystemSettings} variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
                Save Profile & Pricing
              </MuiButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Alert Rules */}
      {activeTab === 'alerts' && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
              <BellRing size={18} className="text-blue-500" /> Thresholds & Alerts Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Feed Shortfall Critical Threshold (kg)" type="number" fullWidth variant="outlined" value={feedThresholdKg} onChange={(e) => setFeedThresholdKg(e.target.value)} helperText="Triggers critical dashboard/feed warnings when feed drops below this level." />
              <TextField label="Egg Output Drop Percentage Warning limit (%)" type="number" fullWidth variant="outlined" value={eggDropPercentage} onChange={(e) => setEggDropPercentage(e.target.value)} helperText="Warns if egg collection dips by more than this percentage." />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Automated Alert Dispatch Channels</p>
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <FormControlLabel control={<Checkbox checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">Instant SMS Alerts</span>} />
                <FormControlLabel control={<Checkbox checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">Email Digest</span>} />
                <FormControlLabel control={<Checkbox checked={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">WhatsApp Business Pings</span>} />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <MuiButton onClick={handleSaveAlertSettings} variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
                Save Alert Configuration
              </MuiButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Gateways */}
      {activeTab === 'gateways' && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" /> Multi-Payment Gateway & Billing Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">Nigeria & Africa</span>
                <h4 className="text-sm font-semibold text-slate-800">Paystack Integration</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Paystack Public Key" fullWidth variant="outlined" value={paystackPublicKey} onChange={(e) => setPaystackPublicKey(e.target.value)} />
                <TextField label="Paystack Secret Key" type="password" fullWidth variant="outlined" value={paystackSecretKey} onChange={(e) => setPaystackSecretKey(e.target.value)} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">Global SaaS</span>
                <h4 className="text-sm font-semibold text-slate-800">Stripe Integration</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Stripe Publishable Key" fullWidth variant="outlined" value={stripePublicKey} onChange={(e) => setStripePublicKey(e.target.value)} />
                <TextField label="Stripe Secret Key" type="password" fullWidth variant="outlined" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} />
              </div>
            </div>

            <div className="pt-6 justify-end flex">
              <MuiButton onClick={handleSaveSystemSettings} variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
                Save Payment Gateway Keys
              </MuiButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-100 mt-8">
        <CardHeader className="border-b border-red-50 bg-red-50/50">
          <CardTitle className="text-sm font-semibold uppercase text-red-600 flex items-center gap-2">
            <Trash2 size={18} /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-slate-900">Delete Current Workspace</h3>
              <p className="text-sm text-slate-500 mt-1">Permanently remove this workspace and all its data. This action is irreversible.</p>
            </div>
            <MuiButton 
              disabled={workspaceId === 'main' || isDeleting}
              onClick={handleDeleteWorkspace} 
              variant="outlined" 
              color="error"
              sx={{ borderRadius: 2, px: 4, py: 1.5 }}
            >
              {workspaceId === 'main' ? 'Cannot Delete Main Workspace' : isDeleting ? 'Deleting...' : 'Delete Workspace'}
            </MuiButton>
          </div>
        </CardContent>
      </Card>

      {/* 3-Tier Upgrade Modal (Directly Inspired by Reference Screenshot 1) */}
      <Dialog 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        fullWidth 
        maxWidth="lg" 
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
      >
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="text-amber-400" size={20} /> Upgrade Your Subscription Plan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Scale your poultry farm operations with AI, CCTV, and enterprise hub tools.</p>
          </div>
          <button 
            onClick={() => setShowUpgradeModal(false)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <DialogContent className="p-6 bg-slate-50">
          {/* Monthly vs Annual Radio Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isAnnual ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Billed Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAnnual ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Billed Annually
                <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* 3-Tier Grid Comparison Cards (Matching Reference Screenshot 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Starter Plan (Free) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Starter Plan</h3>
                <p className="text-xs text-slate-500 mb-4 h-10">Manage single farm branch and basic flock logs for small setups.</p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <div className="text-3xl font-extrabold text-slate-900">₦0</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Free Forever</div>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>1 Farm Branch limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>2 Staff members max</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>Manual Egg & Feed logging</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>Basic Flock health records</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <X size={16} className="text-slate-300 flex-shrink-0" />
                    <span>AI Voice Auto-Logger</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <X size={16} className="text-slate-300 flex-shrink-0" />
                    <span>CCTV Live Surveillance</span>
                  </li>
                </ul>
              </div>

              <button
                disabled={currentTier === 'free'}
                className="w-full bg-slate-100 text-slate-600 font-bold text-xs py-3 rounded-xl border border-slate-200 disabled:opacity-75"
              >
                {currentTier === 'free' ? 'Current Plan' : 'Free Starter'}
              </button>
            </div>

            {/* 2. Commercial Pro Plan (POPULAR BADGE - Screenshot 1 Style) */}
            <div className="bg-slate-900 text-white border-2 border-indigo-500 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow">
                MOST POPULAR
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-1">Commercial Pro</h3>
                <p className="text-xs text-indigo-200 mb-4 h-10">AI voice auto-logger, live CCTV predator alerts, and unlimited scale.</p>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-6">
                  <div className="text-3xl font-extrabold text-white">
                    ₦{((isAnnual ? (proPlan?.priceAnnual || 144000) : (proPlan?.priceMonthly || 15000))).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-indigo-300 font-bold uppercase mt-0.5">
                    {isAnnual ? 'Billed Annually' : 'Billed Monthly'}
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-200 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">Everything in Starter Plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">AI Voice & Text Auto-Logger</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">CCTV Live Stream & AI Predator Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">Export PDF & Excel Financial Reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Unlimited Farm Branches & Staff</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleInitiateCheckout('pro', isAnnual)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-xl transition-all cursor-pointer"
              >
                {currentTier === 'pro' ? 'Current Plan (Renew)' : 'Upgrade to Commercial Pro'}
              </button>
            </div>

            {/* 3. Enterprise & Cooperative Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Enterprise & Coop</h3>
                <p className="text-xs text-slate-500 mb-4 h-10">Multi-farm enterprise hub & white-label cooperative management.</p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <div className="text-3xl font-extrabold text-slate-900">
                    ₦{((isAnnual ? (enterprisePlan?.priceAnnual || 432000) : (enterprisePlan?.priceMonthly || 45000))).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {isAnnual ? 'Billed Annually' : 'Billed Monthly'}
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-bold">Everything in Commercial Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Multi-Farm Enterprise Management Hub</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Cooperative White-Label Portal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>24/7 Priority Consultant Phone Line</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Custom API & Warehouse Logistics</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleInitiateCheckout('enterprise', isAnnual)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow transition-all cursor-pointer"
              >
                {currentTier === 'enterprise' ? 'Current Plan (Renew)' : 'Get Enterprise'}
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Method Modal */}
      <Dialog 
        open={openAddCardModal} 
        onClose={() => setOpenAddCardModal(false)}
        fullWidth 
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
      >
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-400" /> Save New Payment Method
          </h3>
          <button onClick={() => setOpenAddCardModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <DialogContent className="p-6 space-y-4">
          <p className="text-xs text-slate-500 mb-2">
            Enter your card details below to save a payment method for plan billing and automated renewals.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <FormControl fullWidth size="small">
              <InputLabel>Payment Network</InputLabel>
              <Select value={cardBrand} label="Payment Network" onChange={(e) => setCardBrand(e.target.value)}>
                <MenuItem value="Visa">Visa</MenuItem>
                <MenuItem value="Mastercard">Mastercard</MenuItem>
                <MenuItem value="Verve">Verve</MenuItem>
                <MenuItem value="Apple Pay">Apple Pay 🍎</MenuItem>
                <MenuItem value="Google Pay">Google Pay G</MenuItem>
              </Select>
            </FormControl>

            <TextField 
              label="Last 4 Digits" 
              placeholder="e.g. 4242" 
              size="small" 
              slotProps={{ htmlInput: { maxLength: 4 } }}
              value={cardLast4} 
              onChange={(e) => setCardLast4(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField 
              label="Expiry Month (MM)" 
              placeholder="12" 
              size="small" 
              value={cardExpMonth} 
              onChange={(e) => setCardExpMonth(e.target.value)} 
            />
            <TextField 
              label="Expiry Year (YYYY)" 
              placeholder="2028" 
              size="small" 
              value={cardExpYear} 
              onChange={(e) => setCardExpYear(e.target.value)} 
            />
          </div>

          <FormControlLabel 
            control={<Checkbox checked={cardIsDefault} onChange={(e) => setCardIsDefault(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} 
            label={<span className="text-xs font-semibold text-slate-700">Set as Primary Default Card</span>} 
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setOpenAddCardModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPaymentMethod}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow cursor-pointer"
            >
              Save Payment Method
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
