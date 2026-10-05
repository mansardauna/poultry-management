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
import { Settings, BellRing, User, DollarSign, Trash2, CheckCircle2, Shield, CreditCard, Download, X, Sparkles, Star, Plus, Zap, Crown, ShieldCheck, QrCode, Copy, Check } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { useLanguage } from '../LanguageContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { 
  SUPPORTED_CURRENCIES, 
  getCurrencyInfo, 
  getDefaultExchangeRate, 
  convertBetweenCurrencies 
} from '@/lib/currency';

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
  currencySymbol?: string;
  exchangeRate?: number;
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
  role?: string;
  currentUser?: {
    name?: string;
    username?: string;
    email?: string;
    role?: string;
    attendanceDays?: number;
    salary?: number;
  };
}

/**
 * SettingsClient component for configuring platform settings.
 *
 * @param props - Component properties.
 */
export function SettingsClient({ initialSettings, systemSettings, initialPaymentMethods = [], initialSubscriptionHistory = [], workspaceId, role = 'Admin', currentUser }: SettingsClientProps) {
  const { texts, t, formatNumber, formatCurrency } = useLanguage();
  const { confirm } = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'profile' | 'alerts' | 'gateways' | 'subscription'>(
    role === 'Staff' ? 'profile' : (tabParam === 'subscription' || tabParam === 'billing' ? 'subscription' : 'profile')
  );

  useEffect(() => {
    if (role === 'Staff' && activeTab !== 'profile') {
      setActiveTab('profile');
    }
  }, [role, activeTab]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');
  
  // Real Dynamic Payment Methods & Subscription History
  const [paymentMethods, setPaymentMethods] = useState<any[]>(initialPaymentMethods);
  const { activeWorkspace, updateWorkspace } = useWorkspace();
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
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSaasPlans(data);
      })
      .catch(() => {});
  }, []);

  const activePlan = saasPlans.find(p => p.id === currentTier);
  const proPlan = saasPlans.find(p => p.id === 'pro');
  const enterprisePlan = saasPlans.find(p => p.id === 'enterprise');
  const planCurrency = proPlan?.currencySymbol || activePlan?.currencySymbol || '$';

  useEffect(() => {
    const match = document.cookie.match(/pfms_tier=([^;]+)/);
    if (match) setCurrentTier(match[1]);

    if (isUpgraded) {
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        fetch('/api/checkout/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        }).then(res => res.json()).then(data => {
          if (data.tier) {
            setCurrentTier(data.tier);
            toast.success(`Subscription active! Upgraded to ${data.tier === 'enterprise' || data.tier === 'entrepreneur' ? 'Enterprise & Cooperative' : 'Commercial Pro'}.`, { id: 'settings-upgrade-toast' });
            router.refresh();
          } else if (data.error) {
            toast.error(data.error, { id: 'settings-upgrade-error' });
          }
        }).catch(() => {});
      }
    }
  }, [isUpgraded, searchParams, router]);
  const [feedThresholdKg, setFeedThresholdKg] = useState(String(initialSettings?.feedThresholdKg || 50));
  const [eggDropPercentage, setEggDropPercentage] = useState(String(initialSettings?.eggDropPercentage || 15));
  const [minDailyEggCount, setMinDailyEggCount] = useState(String(initialSettings?.minDailyEggCount || 0));
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
  const [farmCurrency, setFarmCurrency] = useState(systemSettings?.currencySymbol || '$');
  const [farmExchangeRate, setFarmExchangeRate] = useState(String(systemSettings?.exchangeRate || '1.0'));

  const handleFarmCurrencyChange = (newCurrency: string) => {
    const oldCurrency = farmCurrency;
    const oldRate = Number(farmExchangeRate) > 0 ? Number(farmExchangeRate) : getDefaultExchangeRate(oldCurrency);
    const newRate = getDefaultExchangeRate(newCurrency);

    setFarmCurrency(newCurrency);
    setFarmExchangeRate(String(newRate));

    // Convert egg crate prices from old currency to new currency using USD as base
    const smallNum = Number(eggCratePriceSmall);
    if (smallNum > 0) {
      const convertedSmall = convertBetweenCurrencies(smallNum, oldCurrency, newCurrency, oldRate, newRate);
      setEggCratePriceSmall(String(convertedSmall));
    }

    const largeNum = Number(eggCratePriceLarge);
    if (largeNum > 0) {
      const convertedLarge = convertBetweenCurrencies(largeNum, oldCurrency, newCurrency, oldRate, newRate);
      setEggCratePriceLarge(String(convertedLarge));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pfms_currency_updated', { detail: { currencySymbol: newCurrency } }));
    }

    toast.success(t(`Farm currency switched to ${newCurrency}. Converted prices from base USD.`));
  };
  const [paystackPublicKey, setPaystackPublicKey] = useState(systemSettings?.paystackPublicKey || '');
  const [paystackSecretKey, setPaystackSecretKey] = useState(systemSettings?.paystackSecretKey || '');
  const [stripePublicKey, setStripePublicKey] = useState(systemSettings?.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  const [stripeSecretKey, setStripeSecretKey] = useState(systemSettings?.stripeSecretKey || '');
  const [flutterwavePublicKey, setFlutterwavePublicKey] = useState(systemSettings?.flutterwavePublicKey || '');
  const [flutterwaveSecretKey, setFlutterwaveSecretKey] = useState(systemSettings?.flutterwaveSecretKey || '');
  const [bankName, setBankName] = useState(systemSettings?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(systemSettings?.accountNumber || '');
  const [accountName, setAccountName] = useState(systemSettings?.accountName || '');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update password');
      }
    } catch (_err) {
      toast.error('An error occurred while updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Two-Factor Authentication (2FA) State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ setupSecret?: string; qrCodeUrl?: string } | null>(null);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState('');
  const [is2FASubmitting, setIs2FASubmitting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    fetch('/api/auth/2fa')
      .then(res => res.json())
      .then(data => {
        if (data?.enabled) {
          setTwoFactorEnabled(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpen2FASetup = async () => {
    try {
      const res = await fetch('/api/auth/2fa');
      const data = await res.json();
      if (data?.setupSecret) {
        setTwoFactorSetup(data);
        setShowTwoFactorModal(true);
      }
    } catch {
      toast.error(t('Failed to initialize 2FA setup', 'Failed to initialize 2FA setup'));
    }
  };

  const handleConfirmEnable2FA = async () => {
    if (!twoFactorCodeInput || twoFactorCodeInput.trim().length < 6) {
      toast.error(t('Please enter the 6-digit verification code', 'Please enter the 6-digit verification code'));
      return;
    }
    setIs2FASubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          code: twoFactorCodeInput.trim(),
          secret: twoFactorSetup?.setupSecret,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || t('Two-Factor Authentication activated successfully!', 'Two-Factor Authentication activated successfully!'));
        setTwoFactorEnabled(true);
        setShowTwoFactorModal(false);
        setTwoFactorCodeInput('');
      } else {
        toast.error(data.error || t('Failed to activate 2FA', 'Failed to activate 2FA'));
      }
    } catch {
      toast.error(t('Network error while activating 2FA', 'Network error while activating 2FA'));
    } finally {
      setIs2FASubmitting(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!await confirm(t("Are you sure you want to disable Two-Factor Authentication?", "Are you sure you want to disable Two-Factor Authentication?"))) return;
    setIs2FASubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || t('2FA disabled', '2FA disabled'));
        setTwoFactorEnabled(false);
      } else {
        toast.error(data.error || t('Failed to disable 2FA', 'Failed to disable 2FA'));
      }
    } catch {
      toast.error(t('Failed to disable 2FA', 'Failed to disable 2FA'));
    } finally {
      setIs2FASubmitting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveAlertSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedThresholdKg: Number(feedThresholdKg),
          eggDropPercentage: Number(eggDropPercentage),
          minDailyEggCount: Number(minDailyEggCount) || 0,
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
          currencySymbol: farmCurrency,
          exchangeRate: Number(farmExchangeRate) > 0 ? Number(farmExchangeRate) : 1.0,
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
        if (activeWorkspace && farmName.trim() && farmName.trim() !== activeWorkspace.name) {
          try {
            await updateWorkspace(activeWorkspace.id, farmName.trim(), activeWorkspace.type);
          } catch {}
        }
        toast.success('System & branch settings saved!');
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
    if (!await confirm(t("Are you sure you want to delete this workspace? This action cannot be undone.", "Are you sure you want to delete this workspace? This action cannot be undone."))) return;
    
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
    if (!await confirm(t('Remove this payment method?', 'Remove this payment method?'))) return;
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
      toast.loading('Initiating plan upgrade...', { id: 'chk-toast' });
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, isAnnual: isAnnualCycle })
      });
      const data = await res.json();
      toast.dismiss('chk-toast');
      if (data.url) {
        toast.loading('Redirecting to secure payment checkout...', { id: 'chk-toast' });
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
    <div className="w-full space-y-6 pb-12 font-sans">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Settings size={32} className="text-indigo-600" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {role === 'Staff' ? t('Staff Account & Security') : t('Settings & Subscription')}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {role === 'Staff' 
                ? t('Manage your staff profile credentials and update your login password.') 
                : t('Manage your billing plans, alert rules, and farm profile.')}
            </p>
          </div>
        </div>

        {role === 'Admin' && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Sparkles size={16} /> {t("Upgrade Plan")}
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {role !== 'Staff' && (
          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-3 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'subscription' 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign size={16} /> {t("My Subscription & Billing")}
          </button>
        )}
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={16} /> {role === 'Staff' ? t('My Profile & Security') : t('Farm Profile & Pricing')}
        </button>
        {role !== 'Staff' && (
          <>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-3 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'alerts' 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BellRing size={16} /> {t("Alert Rules")}
            </button>
            <button
              onClick={() => setActiveTab('gateways')}
              className={`py-3 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'gateways' 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard size={16} /> {t("Payment Gateway Keys")}
            </button>
          </>
        )}
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
                    <h2 className="text-xl font-bold text-slate-900">{farmName || activeWorkspace?.name || t('My Poultry Farm')}</h2>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {t("Billed Monthly")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t("Farm ID:")} {computedFarmId} | {t("Account Admin:")} {adminName || t('Farm Owner')}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <p className="text-slate-400 font-bold">{t("Account Admin")}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{adminName || t('Farm Owner')}</p>
                  <p className="text-slate-500">{adminEmail || t('Not Configured')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">{t("Phone Number")}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{adminPhone || t('Not Configured')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">{t("Billing Region")}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{billingRegion || t('Nigeria & West Africa (NGN)')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Plan Summary Box */}
          <Card className="border-2 border-indigo-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-indigo-50/30">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>{t("Current Active Subscription")}</span>
                <span className={`text-xs px-3.5 py-1 rounded-full font-extrabold ${
                  currentTier === 'enterprise' ? 'bg-purple-600 text-white shadow-sm' :
                  currentTier === 'pro' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-800'
                }`}>
                  {currentTier === 'enterprise' ? t('Enterprise Plus') : currentTier === 'pro' ? t('Commercial Pro') : t('Free Starter')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatCurrency(
                        activePlan 
                          ? (isAnnual ? Math.round(activePlan.priceAnnual / 12) : activePlan.priceMonthly) 
                          : (currentTier === 'enterprise' ? (enterprisePlan?.priceMonthly || 45) : currentTier === 'pro' ? (proPlan?.priceMonthly || 15) : 0),
                        planCurrency
                      )}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{t("/ month")}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 max-w-lg leading-relaxed">
                    {currentTier === 'enterprise' 
                      ? t('Enterprise Plus includes Multi-Farm Enterprise Hub, White-Label Cooperative Portal, 24/7 Consultant Support, Custom API & Logistics.')
                      : currentTier === 'pro'
                      ? t('Commercial Pro includes AI Voice Auto-Logger, CCTV Live Surveillance, PDF/Excel Exports, and Unlimited Branches & Staff.')
                      : t('Free Starter Plan includes up to 1 branch, 2 staff members, and basic flock logs.')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    {currentTier === 'free' ? t('Upgrade Plan') : t('Manage / Change Tier')}
                  </button>
                  {currentTier !== 'free' && (
                    <button
                      onClick={async () => {
                        if (await confirm(t('Cancel your active subscription? Your account will downgrade to Free Starter.'))) {
                          try {
                            toast.loading(t('Cancelling subscription...'), { id: 'cancel-toast' });
                            const res = await fetch('/api/subscription/cancel', { method: 'POST' });
                            toast.dismiss('cancel-toast');
                            if (res.ok) {
                              document.cookie = "pfms_tier=free; path=/; max-age=86400";
                              setCurrentTier('free');
                              toast.success(t('Subscription cancelled successfully. Account downgraded to Free Starter.'));
                            } else {
                              toast.error(t('Failed to cancel subscription'));
                            }
                          } catch (_e) {
                            toast.dismiss('cancel-toast');
                            toast.error(t('Error cancelling subscription'));
                          }
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs uppercase px-4 py-3 rounded-xl transition-colors cursor-pointer border border-red-200 whitespace-nowrap"
                    >
                      {t("Cancel Plan")}
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Profile & Pricing */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {role === 'Staff' ? (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User size={18} className="text-emerald-500" /> {t("Staff Member Profile")}
                  </span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {t("Farm Attendant (Staff)")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("Staff Full Name")}</span>
                    <p className="text-sm font-bold text-slate-900">{currentUser?.name || t('Farm Attendant')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("Login Username")}</span>
                    <p className="text-sm font-mono font-bold text-slate-900">{currentUser?.username || 'staff'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("Assigned Branch")}</span>
                    <p className="text-sm font-bold text-indigo-600">{activeWorkspace?.name || t('Main Location')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("Farm Organization ID")}</span>
                    <p className="text-sm font-mono font-medium text-slate-600">{computedFarmId}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <strong>{t("Role Permissions Notice:")}</strong> {t("Farm organization details, egg pricing, payment gateways, and subscription billing are managed exclusively by the farm Administrator. As a staff attendant, you can update your login password below.")}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User size={18} className="text-green-500" /> {t("Farm Profile & Pricing")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField label={t("Farm / Organization Name")} fullWidth variant="outlined" value={farmName} onChange={(e) => setFarmName(e.target.value)} helperText={t("Official farm name displayed on billing cards and invoices.")} />
                  <TextField label={t("Admin Full Name")} fullWidth variant="outlined" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                  <TextField label={t("Admin Email Address")} type="email" fullWidth variant="outlined" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                  <TextField label={t("Admin Contact Phone")} fullWidth variant="outlined" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="farm-currency-select-label">{t("Farm Local Currency")}</InputLabel>
                    <Select
                      labelId="farm-currency-select-label"
                      label={t("Farm Local Currency")}
                      value={farmCurrency}
                      onChange={(e) => handleFarmCurrencyChange(e.target.value as string)}
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <MenuItem key={c.code} value={c.symbol}>
                          {c.symbol} - {c.name} ({c.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField 
                    label={t("USD Exchange Rate (1 USD =)")} 
                    type="number" 
                    fullWidth 
                    variant="outlined" 
                    value={farmExchangeRate} 
                    onChange={(e) => setFarmExchangeRate(e.target.value)} 
                    helperText={t(`Current: 1 USD ($) = ${farmExchangeRate} ${farmCurrency}. Changing currency converts amounts from USD base.`)} 
                  />
                  
                  <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1">
                      <DollarSign size={14} /> {t("Egg Pricing Configuration")} ({farmCurrency})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TextField label={`${t("Egg Price Per Crate (Small)")} - ${farmCurrency}`} type="number" fullWidth variant="outlined" value={eggCratePriceSmall} onChange={(e) => setEggCratePriceSmall(e.target.value)} />
                      <TextField label={`${t("Egg Price Per Crate (Large)")} - ${farmCurrency}`} type="number" fullWidth variant="outlined" value={eggCratePriceLarge} onChange={(e) => setEggCratePriceLarge(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="pt-6 flex justify-end">
                  <MuiButton onClick={handleSaveSystemSettings} variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
                    {t("Save Profile & Pricing")}
                  </MuiButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Security & Change Password */}
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" /> {t("Account Security & Change Password")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TextField 
                  label={t("Current Password")} 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                />
                <TextField 
                  label={t("New Password")} 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  helperText={t("Minimum 6 characters")}
                />
                <TextField 
                  label={t("Confirm New Password")} 
                  type="password" 
                  fullWidth 
                  variant="outlined" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </div>
              <div className="pt-4 flex justify-end">
                <MuiButton 
                  onClick={handleUpdatePassword} 
                  disabled={isUpdatingPassword || !newPassword}
                  variant="contained" 
                  sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}
                >
                  {isUpdatingPassword ? t('Updating Password...') : t('Update Password')}
                </MuiButton>
              </div>

              {/* Two-Factor Authentication (2FA) Subsection */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-3 rounded-xl ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{t("Two-Factor Authentication (2FA)", "Two-Factor Authentication (2FA)")}</h4>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                          {twoFactorEnabled ? t("Active", "Active") : t("Disabled", "Disabled")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {twoFactorEnabled
                          ? t("Your account is fortified with an authenticator app (Google Authenticator, Microsoft Authenticator).", "Your account is fortified with an authenticator app (Google Authenticator, Microsoft Authenticator).")
                          : t("Require a 6-digit verification code from your authenticator app each time you sign in.", "Require a 6-digit verification code from your authenticator app each time you sign in.")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {twoFactorEnabled ? (
                      <button
                        type="button"
                        onClick={handleDisable2FA}
                        disabled={is2FASubmitting}
                        className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                      >
                        {is2FASubmitting ? t("Processing…") : t("Disable 2FA", "Disable 2FA")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpen2FASetup}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck size={14} />
                        {t("Enable 2FA", "Enable 2FA")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Setup Modal */}
          <Dialog open={showTwoFactorModal} onClose={() => setShowTwoFactorModal(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
            <DialogContent className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{t("Enable Two-Factor Authentication", "Enable Two-Factor Authentication")}</h3>
                    <p className="text-xs text-slate-500">{t("Scan QR code with your authenticator app", "Scan QR code with your authenticator app")}</p>
                  </div>
                </div>
                <button onClick={() => setShowTwoFactorModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                  <p className="font-semibold text-indigo-950">
                    {t("Step 1: Scan the QR Code", "Step 1: Scan the QR Code")}
                  </p>
                  <p>
                    {t("Open Google Authenticator, Microsoft Authenticator, or 1Password and scan this code to link your account:", "Open Google Authenticator, Microsoft Authenticator, or 1Password and scan this code to link your account:")}
                  </p>
                </div>

                {twoFactorSetup?.qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={twoFactorSetup.qrCodeUrl} 
                      alt="2FA QR Code" 
                      className="w-44 h-44 object-contain rounded-lg border border-slate-100"
                    />
                    <div className="mt-3 text-center space-y-1">
                      <p className="text-[11px] text-slate-400 font-medium">{t("Can't scan? Enter secret key manually:", "Can't scan? Enter secret key manually:")}</p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 select-all">
                          {twoFactorSetup.setupSecret}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            if (twoFactorSetup?.setupSecret) {
                              navigator.clipboard.writeText(twoFactorSetup.setupSecret);
                              setCopiedSecret(true);
                              setTimeout(() => setCopiedSecret(false), 2000);
                              toast.success(t("Secret copied to clipboard", "Secret copied to clipboard"));
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                          title="Copy Secret"
                        >
                          {copiedSecret ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    {t("Step 2: Enter the 6-Digit Code from Authenticator", "Step 2: Enter the 6-Digit Code from Authenticator")}
                  </label>
                  <input
                    type="text"
                    value={twoFactorCodeInput}
                    onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full border-2 border-slate-200 rounded-xl p-3 text-center text-xl font-mono font-bold tracking-widest focus:outline-none focus:border-indigo-600 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTwoFactorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEnable2FA}
                  disabled={is2FASubmitting || twoFactorCodeInput.length < 6}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:bg-indigo-300 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  {is2FASubmitting ? t("Verifying…") : t("Verify & Enable 2FA", "Verify & Enable 2FA")}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab 3: Alert Rules */}
      {activeTab === 'alerts' && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BellRing size={18} className="text-blue-500" /> {t("Thresholds & Alerts Rules")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField label={t("Feed Shortfall Critical Threshold (kg)")} type="number" fullWidth variant="outlined" value={feedThresholdKg} onChange={(e) => setFeedThresholdKg(e.target.value)} helperText={t("Triggers critical feed warnings and replenishment tasks when feed drops below this level.")} />
              <TextField label={t("Egg Output Drop Warning Limit (%)")} type="number" fullWidth variant="outlined" value={eggDropPercentage} onChange={(e) => setEggDropPercentage(e.target.value)} helperText={t("Warns if egg collection dips by more than this percentage compared to previous record.")} />
              <TextField label={t("Minimum Daily Egg Threshold (Count)")} type="number" fullWidth variant="outlined" value={minDailyEggCount} onChange={(e) => setMinDailyEggCount(e.target.value)} helperText={t("Warns if daily collection count drops below this fixed count (0 to disable).")} />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-3">{t("Automated Alert Dispatch Channels")}</p>
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <FormControlLabel control={<Checkbox checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">{t("Instant SMS Alerts")}</span>} />
                <FormControlLabel control={<Checkbox checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">{t("Email Digest")}</span>} />
                <FormControlLabel control={<Checkbox checked={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">{t("WhatsApp Business Pings")}</span>} />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <MuiButton onClick={handleSaveAlertSettings} variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
                {t("Save Alert Configuration")}
              </MuiButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Gateways */}
      {activeTab === 'gateways' && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-500" /> {t("Multi-Payment Gateway & Billing Keys")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">{t("Nigeria & Africa")}</span>
                <h4 className="text-sm font-semibold text-slate-800">{t("Paystack Integration")}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label={t("Paystack Public Key")} fullWidth variant="outlined" value={paystackPublicKey} onChange={(e) => setPaystackPublicKey(e.target.value)} />
                <TextField label={t("Paystack Secret Key")} type="password" fullWidth variant="outlined" value={paystackSecretKey} onChange={(e) => setPaystackSecretKey(e.target.value)} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">{t("Global SaaS")}</span>
                <h4 className="text-sm font-semibold text-slate-800">{t("Stripe Integration")}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label={t("Stripe Publishable Key")} fullWidth variant="outlined" value={stripePublicKey} onChange={(e) => setStripePublicKey(e.target.value)} />
                <TextField label={t("Stripe Secret Key")} type="password" fullWidth variant="outlined" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} />
              </div>
            </div>

            <div className="pt-6 justify-end flex">
              <MuiButton onClick={handleSaveSystemSettings} variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
                {t("Save Payment Gateway Keys")}
              </MuiButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {role === 'Admin' && (
        <Card className="border-red-100 mt-8">
          <CardHeader className="border-b border-red-50 bg-red-50/50">
            <CardTitle className="text-sm font-semibold uppercase text-red-600 flex items-center gap-2">
              <Trash2 size={18} /> {t("Danger Zone")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-medium text-slate-900">{t("Delete Current Workspace")}</h3>
                <p className="text-sm text-slate-500 mt-1">{t("Permanently remove this workspace and all its data. This action is irreversible.")}</p>
              </div>
              <MuiButton 
                disabled={workspaceId === 'main' || isDeleting}
                onClick={handleDeleteWorkspace} 
                variant="outlined" 
                color="error"
                sx={{ borderRadius: 2, px: 4, py: 1.5 }}
              >
                {workspaceId === 'main' ? t('Cannot Delete Main Workspace') : isDeleting ? t('Deleting...') : t('Delete Workspace')}
              </MuiButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3-Tier Upgrade Modal (Directly Inspired by Reference Screenshot 1) */}
      <Dialog 
        open={showUpgradeModal && role === 'Admin'} 
        onClose={() => setShowUpgradeModal(false)}
        fullWidth 
        maxWidth="lg" 
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
      >
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold tracking-wider flex items-center gap-2">
              <Crown className="text-amber-400" size={20} /> {t("Upgrade Your Subscription Plan")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{t("Scale your poultry farm operations with voice logging, CCTV, and enterprise hub tools.")}</p>
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
                {t("Billed Monthly")}
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAnnual ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t("Billed Annually")}
                <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                  {t("Save 20%")}
                </span>
              </button>
            </div>
          </div>

          {/* 3-Tier Grid Comparison Cards (Matching Reference Screenshot 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Starter Plan (Free) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{t("Starter Plan")}</h3>
                <p className="text-xs text-slate-500 mb-4 h-10">{t("Manage single farm branch and basic flock logs for small setups.")}</p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <div className="text-3xl font-extrabold text-slate-900">{formatCurrency(0, planCurrency)}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">{t("Free Forever")}</div>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{t("1 Farm Branch limit")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{t("2 Staff members max")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{t("Manual Egg & Feed logging")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{t("Basic Flock health records")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <X size={16} className="text-slate-300 flex-shrink-0" />
                    <span>{t("AI Voice Auto-Logger")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <X size={16} className="text-slate-300 flex-shrink-0" />
                    <span>{t("CCTV Live Surveillance")}</span>
                  </li>
                </ul>
              </div>

              <button
                disabled={currentTier === 'free'}
                className="w-full bg-slate-100 text-slate-600 font-bold text-xs py-3 rounded-xl border border-slate-200 disabled:opacity-75"
              >
                {currentTier === 'free' ? t('Current Plan') : t('Free Starter')}
              </button>
            </div>

            {/* 2. Commercial Pro Plan (POPULAR BADGE - Screenshot 1 Style) */}
            <div className="bg-slate-900 text-white border-2 border-indigo-500 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full shadow">
                {t("MOST POPULAR")}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-1">{t("Commercial Pro")}</h3>
                <p className="text-xs text-indigo-200 mb-4 h-10">{t("AI voice auto-logger, live CCTV predator alerts, and unlimited scale.")}</p>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-6">
                  <div className="text-3xl font-extrabold text-white">
                    {formatCurrency(isAnnual ? (proPlan?.priceAnnual || 144) : (proPlan?.priceMonthly || 15), planCurrency)}
                  </div>
                  <div className="text-[10px] text-indigo-300 font-bold mt-0.5">
                    {isAnnual ? t('Billed Annually') : t('Billed Monthly')}
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-200 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">{t("Up to 5 Regional Farm Branches")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">{t("Production Analytics Bar & Line Charts")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">{t("Voice & Text AI Auto-Logger Widget")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">{t("CCTV Live Surveillance Gateway")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-bold">{t("PDF & Excel Export Financial Reports")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>{t("Shift Checklist & Payroll Indicators")}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleInitiateCheckout('pro', isAnnual)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-xl transition-all cursor-pointer"
              >
                {currentTier === 'pro' ? t('Current Plan (Renew)') : t('Upgrade to Commercial Pro')}
              </button>
            </div>

            {/* 3. Enterprise Plus Plan */}
            <div className="bg-white border-2 border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-md relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full shadow-lg tracking-widest">
                {t("PLUS")}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{t("Enterprise Plus")}</h3>
                <p className="text-xs text-slate-500 mb-4 h-10">{t("Multi-farm enterprise hub & white-label cooperative management.")}</p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {formatCurrency(isAnnual ? (enterprisePlan?.priceAnnual || 432) : (enterprisePlan?.priceMonthly || 45), planCurrency)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {isAnnual ? t('Billed Annually') : t('Billed Monthly')}
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-bold">{t("Multi-Farm Branch Matrix & Telemetry")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-bold">{t("Cross-Branch Stock Transfers & Deletion")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-bold">{t("Global White-Labeling & Themes (Logo & PDF)")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-bold">{t("Production REST API Keys & Webhooks")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-bold">{t("24/7 Priority Veterinarian Hotline")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-bold">{t("Wholesale Feed Pool (15% Bulk Discount)")}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleInitiateCheckout('enterprise', isAnnual)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl shadow transition-all cursor-pointer"
              >
                {currentTier === 'enterprise' ? t('Current Plan (Renew)') : t('Get Enterprise Plus')}
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
