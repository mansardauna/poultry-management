'use strict';
'use client';

import { Bell, Search, User, X, CheckCheck, Menu, Globe, Calendar, BookOpen } from 'lucide-react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { useLanguage, Language } from '@/components/features/LanguageContext';
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
    if (isUpgraded && queryTier) {
      fetch('/api/checkout/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: queryTier, demo: true })
      }).then(res => res.json()).then(data => {
        if (data.tier) {
          setCurrentTier(data.tier);
          toast.success(`Account upgraded to ${data.tier === 'enterprise' || data.tier === 'entrepreneur' ? 'Enterprise & Cooperative' : 'Commercial Pro'}!`, { id: 'tier-upgrade-toast' });
          router.refresh();
        }
      });
    }
  }, [isUpgraded, queryTier, router]);

  const { setIsMobileOpen } = useSidebar();
  const { language, setLanguage, texts } = useLanguage();
  const { timeRange, setTimeRange } = useTimeFilter();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const SEARCH_ITEMS = [
    { name: 'Staff Management', desc: 'Add staff, set access roles, view team roster', href: '/dashboard/staff', category: 'Team & Staff', icon: '👥' },
    { name: 'Sales & Merchant Invoices', desc: 'Record sales, generate Paystack invoice links', href: '/dashboard/sales', category: 'Revenue & Sales', icon: '🛒' },
    { name: 'Chicken Batches & Flocks', desc: 'Manage layers, broilers, mortality & transfers', href: '/dashboard/chickens', category: 'Livestock', icon: '🐔' },
    { name: 'Egg Production & Collections', desc: 'Daily egg yield, cushioning audits & maturation', href: '/dashboard/eggs', category: 'Production', icon: '🥚' },
    { name: 'Feed Stock & Consumption', desc: 'Track feed usage, restock pipeline & threshold alerts', href: '/dashboard/feed', category: 'Inventory & Feed', icon: '🌾' },
    { name: 'Finance & Expense Tracker', desc: 'Log expenses, review profit & loss, cashflow', href: '/dashboard/finance', category: 'Accounting', icon: '💲' },
    { name: 'Flock Health & Medication', desc: 'Vaccination schedules, medication templates & health logs', href: '/dashboard/health', category: 'Health & Vet', icon: '💉' },
    { name: 'CCTV Camera Surveillance', desc: 'Pair cameras via WebRTC phone scanner or QR image', href: '/dashboard/cctv', category: 'Security & CCTV', icon: '🎥' },
    { name: 'Housing & Pen Facilities', desc: 'Manage pen houses, bird capacity & ventilation', href: '/dashboard/housing', category: 'Facilities', icon: '🏠' },
    { name: 'Equipment & Inventory', desc: 'Tool stock, farm equipment, maintenance logs', href: '/dashboard/inventory', category: 'Equipment', icon: '🔧' },
    { name: 'Farm Contacts Directory', desc: 'Customers, feed suppliers, buyers & vet contacts', href: '/dashboard/contacts', category: 'Directory', icon: '📞' },
    { name: 'Enterprise Hub', desc: 'Cooperative management & multi-farm reports', href: '/dashboard/enterprise', category: 'Enterprise', icon: '🏢' },
    { name: 'Account Settings & Plans', desc: 'Billing, user account, multi-branch setup', href: '/dashboard/settings', category: 'Account Settings', icon: '⚙️' },
  ];

  const filteredSearchResults = searchQuery.trim() === '' 
    ? SEARCH_ITEMS.slice(0, 4) 
    : SEARCH_ITEMS.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    const matched = SEARCH_ITEMS.find(item => 
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

    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Mobile Search Icon Button (visible when search is NOT active on mobile) */}
      {!isSearchFocused && (
        <button
          onClick={() => setIsSearchFocused(true)}
          className="sm:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-1"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
      )}

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
            placeholder={`${texts.common.search || 'Search'} farm records, staff, batches, invoices...`}
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
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>{searchQuery ? `Search Results (${filteredSearchResults.length})` : 'Quick Jump Shortcuts'}</span>
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
                  No matching farm modules or records found for &quot;<strong>{searchQuery}</strong>&quot;.
                </div>
              ) : (
                filteredSearchResults.map((item) => (
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
                      <span className="text-xl p-2 rounded-lg bg-slate-100 group-hover:bg-indigo-100 transition-colors shrink-0">
                        {item.icon}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      Jump →
                    </span>
                  </button>
                ))
              )}
            </div>

            {searchQuery && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={handleSearch}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Press Enter to perform global query &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Time Range Filter */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors">
          <Calendar size={14} className="text-indigo-500 mr-2 ml-1" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="bg-transparent border-0 outline-none cursor-pointer font-semibold text-slate-700 focus:ring-0 py-0 pr-6 pl-0"
          >
            <option value="all">{texts.common.allTime}</option>
            <option value="weekly">{texts.common.weekly}</option>
            <option value="monthly">{texts.common.monthly}</option>
            <option value="yearly">{texts.common.yearly}</option>
          </select>
        </div>

        {/* Language Selection Dropdown */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
          <Globe size={16} className="text-indigo-500 mr-1" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent border-0 outline-none cursor-pointer font-semibold text-slate-700 focus:ring-0 py-0 pr-4 pl-0 appearance-none w-8 sm:w-auto"
          >
            <option value="en" className="sm:hidden">EN</option>
            <option value="en" className="hidden sm:block">English (EN)</option>
            <option value="es" className="sm:hidden">ES</option>
            <option value="es" className="hidden sm:block">Español (ES)</option>
            <option value="ar" className="sm:hidden">AR</option>
            <option value="ar" className="hidden sm:block">العربية (AR)</option>
            <option value="de" className="sm:hidden">DE</option>
            <option value="de" className="hidden sm:block">Deutsch (DE)</option>
            <option value="fr" className="sm:hidden">FR</option>
            <option value="fr" className="hidden sm:block">Français (FR)</option>
            <option value="zh" className="sm:hidden">ZH</option>
            <option value="zh" className="hidden sm:block">中文 (ZH)</option>
          </select>
        </div>

        {/* User Guide & Documentation Link */}
        <button
          onClick={() => router.push('/documentation')}
          className="hidden sm:flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
          title="Open User Guide & Documentation"
        >
          <BookOpen size={14} className="text-indigo-600" />
          <span>Docs</span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="p-2 text-slate-400 hover:text-indigo-600 rounded-md transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Notifications"
          >
            <Bell size={24} />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-semibold ring-2 ring-white">
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[360px] sm:max-w-[384px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-800">{texts.dashboard.alertLogsQueue}</span>
                  {unreadNotifications.length > 0 && (
                    <span className="text-[10px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {unreadNotifications.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={13} />
                      Mark all read
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
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'unread'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Unread ({unreadNotifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('read')}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'read'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Read ({readNotifications.length})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto">
                {displayed.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
                    <Bell size={28} className="text-slate-200" />
                    <p className="text-xs text-slate-400 font-medium">
                      {activeTab === 'unread' ? texts.dashboard.allCaughtUpAlerts : 'No read notifications.'}
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
                            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${severityStyles[n.severity]}`}>
                              {n.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{n.date}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            title="Mark as read"
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
                  {notifications.length} total alerts · Auto-refreshes every 30s
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Badge or Upgrade CTA */}
        {role === 'SuperAdmin' ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 md:pl-4">
            <span className="bg-indigo-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
              Platform Super Admin
            </span>
          </div>
        ) : (
          role === 'Admin' && currentTier === 'free' && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 md:pl-4">
              <button
                onClick={() => router.push('/dashboard/settings?tab=subscription')}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span>Upgrade</span>
              </button>
            </div>
          )
        )}
      </div>
    </header>
  );
}
