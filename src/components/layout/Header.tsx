'use strict';
'use client';

import { 
  Bell, 
  Search, 
  User, 
  X, 
  CheckCheck, 
  Menu, 
  Globe, 
  Calendar, 
  BookOpen,
  SlidersHorizontal,
  BarChart3,
  Settings,
  Database,
  CreditCard,
  Mail,
  Package,
  Sparkles,
  Building2,
  Shield,
  Users,
  ShoppingCart,
  Bird,
  Egg,
  Wheat,
  DollarSign,
  Pill,
  Video,
  Home,
  Wrench,
  Contact,
  LucideIcon
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { useSidebar } from './SidebarContext';
import { useLanguage, Language } from '@/components/features/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/types';
import { useTimeFilter, TimeRange } from '@/components/features/TimeFilterContext';
import toast from 'react-hot-toast';

/**
 * Represents a single notification or alert log.
 */
interface AlertLog {
  id: string;
  date: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Info';
  read?: boolean;
}

/**
 * Header component displaying search, language/time filters, notifications, and user info.
 * @param {Object} props
 * @param {string} [props.role='Admin'] - The user's role.
 */
export function Header({ role = 'Admin', tier = 'free' }: { role?: string; tier?: string }) {
  const [notifications, setNotifications] = useState<AlertLog[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpgraded = searchParams.get('upgraded') === 'true';
  const queryTier = searchParams.get('tier');
  const [currentTier, setCurrentTier] = useState(tier);

  useEffect(() => {
    setCurrentTier(tier);
  }, [tier]);

  useEffect(() => {
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
            toast.success(`Account upgraded to ${data.tier === 'enterprise' || data.tier === 'entrepreneur' ? 'Enterprise & Cooperative' : 'Commercial Pro'}!`, { id: 'tier-upgrade-toast' });
            router.refresh();
          } else if (data.error) {
            toast.error(data.error, { id: 'tier-upgrade-error' });
          }
        }).catch(() => {});
      }
    }
  }, [isUpgraded, searchParams, router]);

  const { setIsMobileOpen } = useSidebar();
  const { language, setLanguage, texts, t } = useLanguage();
  const { timeRange, setTimeRange } = useTimeFilter();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const SUPERADMIN_SEARCH_ITEMS: Array<{
    name: string;
    desc: string;
    href: string;
    category: string;
    icon: LucideIcon;
  }> = [
    { name: 'Platform Overview', desc: 'Real-time telemetry, revenue & tenant count', href: '/dashboard/admin?tab=overview', category: 'Platform Telemetry', icon: BarChart3 },
    { name: 'Payment & API Gateways', desc: 'Paystack, Stripe, and Resend API configurations', href: '/dashboard/admin?tab=setup', category: 'Infrastructure & APIs', icon: Settings },
    { name: 'Payment Gateways', desc: 'Paystack & Stripe API keys, webhooks, currency', href: '/dashboard/admin?tab=setup', category: 'Payment Gateways', icon: CreditCard },
    { name: 'Transactional Email (Resend)', desc: 'Resend API key and outbound sender email', href: '/dashboard/admin?tab=setup', category: 'Email Gateway', icon: Mail },
    { name: 'SaaS Plans', desc: 'Pricing packages, Stripe plan IDs, and features', href: '/dashboard/admin?tab=plans', category: 'Plans & Pricing', icon: Package },
    { name: 'Landing Page CMS', desc: 'Hero headlines, announcement banner, support contacts', href: '/dashboard/admin?tab=cms', category: 'CMS & Content', icon: Sparkles },
    { name: 'Farm Workspaces', desc: 'Directory of registered farm workspaces', href: '/dashboard/admin?tab=orgs', category: 'Farms & Workspaces', icon: Building2 },
    { name: 'Platform Settings & Governance', desc: 'System versioning, diagnostics and maintenance', href: '/dashboard/admin?tab=settings', category: 'System Governance', icon: Shield },
    { name: 'Super Admin Documentation', desc: 'Setup guide, installation docs and deployment', href: '/documentation/superadmin-setup-guide.html', category: 'Documentation', icon: BookOpen },
  ];

  const FARM_SEARCH_ITEMS: Array<{
    name: string;
    desc: string;
    href: string;
    category: string;
    icon: LucideIcon;
  }> = [
    { name: 'Staff Management', desc: 'Add staff, set access roles, view team roster', href: '/dashboard/staff', category: 'Team & Staff', icon: Users },
    { name: 'Sales & Merchant Invoices', desc: 'Record sales, generate Paystack invoice links', href: '/dashboard/sales', category: 'Revenue & Sales', icon: ShoppingCart },
    { name: 'Chicken Batches & Flocks', desc: 'Manage layers, broilers, mortality & transfers', href: '/dashboard/chickens', category: 'Livestock', icon: Bird },
    { name: 'Egg Production & Collections', desc: 'Daily egg yield, cushioning audits & maturation', href: '/dashboard/eggs', category: 'Production', icon: Egg },
    { name: 'Feed Stock & Consumption', desc: 'Track feed usage, restock pipeline & threshold alerts', href: '/dashboard/feed', category: 'Inventory & Feed', icon: Wheat },
    { name: 'Finance & Expense Tracker', desc: 'Log expenses, review profit & loss, cashflow', href: '/dashboard/finance', category: 'Accounting', icon: DollarSign },
    { name: 'Flock Health & Medication', desc: 'Vaccination schedules, medication templates & health logs', href: '/dashboard/health', category: 'Health & Vet', icon: Pill },
    { name: 'CCTV Camera Surveillance', desc: 'Pair cameras via WebRTC phone scanner or QR image', href: '/dashboard/cctv', category: 'Security & CCTV', icon: Video },
    { name: 'Housing & Pen Facilities', desc: 'Manage pen houses, bird capacity & ventilation', href: '/dashboard/housing', category: 'Facilities', icon: Home },
    { name: 'Equipment & Inventory', desc: 'Tool stock, farm equipment, maintenance logs', href: '/dashboard/inventory', category: 'Equipment', icon: Wrench },
    { name: 'Farm Contacts Directory', desc: 'Customers, feed suppliers, buyers & vet contacts', href: '/dashboard/contacts', category: 'Directory', icon: Contact },
    { name: 'Enterprise Hub', desc: 'Cooperative management & multi-farm reports', href: '/dashboard/enterprise', category: 'Enterprise', icon: Building2 },
    { name: 'Account Settings & Plans', desc: 'Billing, user account, multi-branch setup', href: '/dashboard/settings', category: 'Account Settings', icon: Settings },
  ];

  const pathname = usePathname();
  const isSuperAdmin = 
    role === 'SuperAdmin' || 
    (typeof window !== 'undefined' && Cookies.get('pfms_role') === 'SuperAdmin') || 
    (typeof window !== 'undefined' && (Cookies.get('pfms_email') === 'owner@poultry.com' || Cookies.get('pfms_email') === 'superadmin@pfms.com')) ||
    pathname.startsWith('/dashboard/admin');
  const currentSearchItems = isSuperAdmin ? SUPERADMIN_SEARCH_ITEMS : FARM_SEARCH_ITEMS;

  const filteredSearchResults = searchQuery.trim() === '' 
    ? currentSearchItems.slice(0, 5) 
    : currentSearchItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    if (isSuperAdmin) {
      const matched = SUPERADMIN_SEARCH_ITEMS.find(item => 
        item.name.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );

      if (matched) {
        router.push(matched.href);
      } else if (query.includes('setup') || query.includes('gateway') || query.includes('db') || query.includes('database') || query.includes('mysql') || query.includes('paystack') || query.includes('stripe')) {
        router.push('/dashboard/admin?tab=setup');
      } else if (query.includes('plan') || query.includes('price') || query.includes('tier') || query.includes('entitlement')) {
        router.push('/dashboard/admin?tab=plans');
      } else if (query.includes('cms') || query.includes('landing') || query.includes('hero') || query.includes('banner')) {
        router.push('/dashboard/admin?tab=cms');
      } else if (query.includes('tenant') || query.includes('org') || query.includes('farm')) {
        router.push('/dashboard/admin?tab=orgs');
      } else if (query.includes('setting') || query.includes('govern') || query.includes('maintain')) {
        router.push('/dashboard/admin?tab=settings');
      } else {
        router.push('/dashboard/admin?tab=overview');
      }
    } else {
      const matched = FARM_SEARCH_ITEMS.find(item => 
        item.name.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query)
      );

      if (matched) {
        router.push(matched.href);
      } else {
        if (query.includes('egg')) router.push('/dashboard/eggs');
        else if (query.includes('feed') || query.includes('wheat')) router.push('/dashboard/feed');
        else if (query.includes('financ') || query.includes('money')) router.push('/dashboard/finance');
        else if (query.includes('sale') || query.includes('invoice')) router.push('/dashboard/sales');
        else if (query.includes('staff') || query.includes('user')) router.push('/dashboard/staff');
        else if (query.includes('health') || query.includes('sick')) router.push('/dashboard/health');
        else if (query.includes('inventor') || query.includes('equip')) router.push('/dashboard/inventory');
        else if (query.includes('cctv') || query.includes('camera')) router.push('/dashboard/cctv');
        else if (query.includes('hous') || query.includes('pen')) router.push('/dashboard/housing');
        else if (query.includes('batch') || query.includes('chicken')) router.push('/dashboard/chickens');
        else router.push('/dashboard');
      }
    }

    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {} finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('pfms_notifications_updated', handleUpdate);
    window.addEventListener('pfms_data_updated', handleUpdate);

    return () => {
      window.removeEventListener('pfms_notifications_updated', handleUpdate);
      window.removeEventListener('pfms_data_updated', handleUpdate);
    };
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);
  const displayed = activeTab === 'unread' ? unreadNotifications : readNotifications;

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    });
    fetchNotifications();
  };

  const severityStyles: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 border-red-200',
    Warning: 'bg-amber-100 text-amber-700 border-amber-200',
    Info: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  const severityDot: Record<string, string> = {
    Critical: 'bg-red-500',
    Warning: 'bg-amber-500',
    Info: 'bg-indigo-500',
  };

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 relative z-30">
      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 -ml-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Expanding & Active Search Bar Container */}
      <div 
        ref={searchContainerRef}
        className={`transition-all duration-300 ${
          isSearchFocused 
            ? 'fixed inset-x-2 top-2 z-50 bg-white p-2 rounded-2xl shadow-2xl border border-indigo-500 block' 
            : 'hidden sm:block flex-1 ml-2 md:ml-0'
        }`}
      >
        <form onSubmit={handleSearch} className="w-full max-w-full md:max-w-md relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={18} className="text-indigo-500" />
          </div>
          <input
            autoFocus={isSearchFocused}
            className={`block w-full pl-10 pr-9 py-2 sm:py-2.5 border rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm font-medium transition-all shadow-sm ${
              isSearchFocused ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-300'
            }`}
            placeholder={
              isSuperAdmin
                ? t('Search tenants, gateways, database, SaaS plans, CMS...', 'Search tenants, gateways, database, SaaS plans, CMS...')
                : t('Search farm records, staff, batches, invoices...', 'Search farm records, staff, batches, invoices...')
            }
            type="search"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isSearchFocused) setIsSearchFocused(true);
            }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          ) : isSearchFocused && (
            <button
              type="button"
              onClick={() => setIsSearchFocused(false)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 sm:hidden"
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Powerful Live Search Results Dropdown Overlay */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
              <span>{searchQuery ? `${t("Search results", "Search results")} (${filteredSearchResults.length})` : t("Quick jump shortcuts", "Quick jump shortcuts")}</span>
              <button 
                onClick={() => setIsSearchFocused(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-2 space-y-1">
              {filteredSearchResults.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Search size={28} className="mx-auto mb-2 opacity-30 text-indigo-600" />
                  {role === 'SuperAdmin'
                    ? <>{t("No matching configuration, gateway, or tenant records found for", "No matching configuration, gateway, or tenant records found for")} &quot;<strong>{searchQuery}</strong>&quot;.</>
                    : <>{t("No matching farm modules or records found for", "No matching farm modules or records found for")} &quot;<strong>{searchQuery}</strong>&quot;.</>
                  }
                </div>
              ) : (
                filteredSearchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href + item.name}
                    onClick={() => {
                      router.push(item.href);
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-indigo-50/70 transition-all flex items-center justify-between group border border-transparent hover:border-indigo-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="p-2 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-600 transition-colors shrink-0">
                        <Icon size={18} />
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {t(item.name, item.name)}
                          </h4>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                            {t(item.category, item.category)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{t(item.desc, item.desc)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      {t("Jump →", "Jump →")}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {searchQuery && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={handleSearch}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {t("Press Enter to perform global query", "Press Enter to perform global query")} &quot;{searchQuery}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>

      <div className="flex items-center space-x-1.5 sm:space-x-3">
        {/* Mobile Search Button (grouped with right items) */}
        {!isSearchFocused && (
          <button
            onClick={() => setIsSearchFocused(true)}
            className="sm:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label={t("Search", "Search")}
            title={t("Search", "Search")}
          >
            <Search size={20} />
          </button>
        )}

        {/* Desktop Time Range Filter (Hidden on mobile & hidden for SuperAdmin) */}
        {role !== 'SuperAdmin' && (
          <div className="hidden md:flex relative items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors">
            <Calendar size={14} className="text-indigo-500 mr-2 ml-1" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-transparent border-0 outline-none cursor-pointer font-semibold text-slate-700 focus:ring-0 py-0 pr-6 pl-0 text-xs"
            >
              <option value="all">{texts.common.allTime}</option>
              <option value="weekly">{texts.common.weekly}</option>
              <option value="monthly">{texts.common.monthly}</option>
              <option value="yearly">{texts.common.yearly}</option>
            </select>
          </div>
        )}

        {/* Desktop Language Selection Dropdown (Hidden on mobile) */}
        <div className="hidden md:flex items-center">
          <LanguageSelector variant="light" />
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen((prev) => {
                if (!prev) fetchNotifications();
                return !prev;
              });
            }}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Notifications"
          >
            <Bell size={20} className="sm:w-5 sm:h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-semibold ring-2 ring-white">
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="fixed top-16 right-3 sm:absolute sm:top-auto sm:right-0 mt-1 w-[calc(100vw-1.5rem)] sm:w-96 max-w-[360px] sm:max-w-[384px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-800">{texts.dashboard.alertLogsQueue}</span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={13} />
                      {t("Mark all read")}
                    </button>
                  )}
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                    activeTab === 'unread'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t("Unread")} ({unreadNotifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('read')}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                    activeTab === 'read'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t("Read")} ({readNotifications.length})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto">
                {displayed.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
                    <Bell size={28} className="text-slate-200" />
                    <p className="text-xs text-slate-400 font-medium">
                      {activeTab === 'unread' ? texts.dashboard.allCaughtUpAlerts : t('No read notifications.')}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {displayed.map((n) => (
                      <li
                        key={n.id}
                        className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors group ${!n.read ? 'bg-indigo-50/30' : ''}`}
                      >
                        {/* Severity dot */}
                        <div className="mt-1.5 flex-shrink-0">
                          <span className={`block w-2 h-2 rounded-full ${severityDot[n.severity] || 'bg-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${severityStyles[n.severity]}`}>
                              {n.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{n.date}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            title={t("Mark as read")}
                            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-indigo-400 hover:text-indigo-600"
                          >
                            <CheckCheck size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400 text-center">
                  {notifications.length} {t("total alerts")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Quick Controls Drawer Toggle (Distinct SlidersHorizontal icon, not hamburger) */}
        <button
          onClick={() => setIsRightDrawerOpen(true)}
          className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
          aria-label={t("Open preferences and filters")}
          title={t("Filters & Preferences")}
        >
          <SlidersHorizontal size={20} />
          {timeRange !== 'all' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          )}
        </button>

        {/* Role Badge or Desktop Upgrade CTA */}
        {isSuperAdmin ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 sm:pl-4">
            <span className="bg-indigo-600 text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap">
              {t("Super Admin")}
            </span>
          </div>
        ) : role === 'Staff' ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 sm:pl-4">
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg whitespace-nowrap">
              {t("Staff Portal")}
            </span>
          </div>
        ) : role === 'Manager' ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 sm:pl-4">
            <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg whitespace-nowrap">
              {t("Farm Manager")}
            </span>
          </div>
        ) : (
          role === 'Admin' && currentTier === 'free' && (
            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3 md:pl-4">
              <button
                onClick={() => router.push('/dashboard/settings?tab=subscription')}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span>{t("Upgrade")}</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* Mobile Right Controls Sidebar / Slide-Over Drawer */}
      {isRightDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsRightDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t("Filters & Controls")}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{t("Quick configuration drawer")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRightDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                  aria-label={t("Close drawer")}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Time Range Filter (Farm users only) */}
                {!isSuperAdmin && (
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Calendar size={14} className="text-indigo-600" />
                      {t("Time Filter")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'all', label: texts.common.allTime || t('All Time') },
                        { id: 'weekly', label: texts.common.weekly || t('Weekly') },
                        { id: 'monthly', label: texts.common.monthly || t('Monthly') },
                        { id: 'yearly', label: texts.common.yearly || t('Yearly') },
                      ].map((tRange) => (
                        <button
                          key={tRange.id}
                          type="button"
                          onClick={() => {
                            setTimeRange(tRange.id as TimeRange);
                          }}
                          className={`px-3 py-2.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                            timeRange === tRange.id
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {tRange.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Language Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <Globe size={14} className="text-indigo-600" />
                    {t("Language")}
                  </label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.id);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          language === lang.id
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{lang.nativeName}</span>
                          <span className="text-[10px] text-slate-400 font-normal truncate">({lang.name})</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono shrink-0 ml-2 ${
                          language === lang.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {lang.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Settings Shortcut */}
                {!isSuperAdmin && (
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Settings size={14} className="text-indigo-600" />
                      {t("Settings & Subscription")}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRightDrawerOpen(false);
                        router.push('/dashboard/settings');
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <span>{t("Account Settings")}</span>
                      <span className="text-[10px] text-indigo-600 font-bold">→</span>
                    </button>
                  </div>
                )}

                {/* Upgrade Promo Card in Drawer for Free Tier */}
                {!isSuperAdmin && role === 'Admin' && currentTier === 'free' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100/60 border border-indigo-200 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                      <Sparkles size={14} className="text-indigo-600" />
                      {t("Upgrade to Commercial Pro")}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t("Get unlimited branches, exportable custom PDF reports, CCTV phone scanning, and multi-staff rosters.")}
                    </p>
                    <button
                      onClick={() => {
                        setIsRightDrawerOpen(false);
                        router.push('/dashboard/settings?tab=subscription');
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>{t("Upgrade Plan")}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                <span>PFMS</span>
                <span className="font-semibold text-indigo-600">{t("Enterprise Edition")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
