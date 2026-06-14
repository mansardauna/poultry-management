'use client';

import { Bell, Search, User, X, CheckCheck, Menu, Globe, Calendar } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSidebar } from './SidebarContext';
import { useLanguage, Language } from '@/components/features/LanguageContext';
import { useTimeFilter, TimeRange } from '@/components/features/TimeFilterContext';

interface AlertLog {
  id: string;
  date: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Info';
  read?: boolean;
}

export function Header({ role = 'Admin' }: { role?: string }) {
  const [notifications, setNotifications] = useState<AlertLog[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setIsMobileOpen } = useSidebar();
  const { language, setLanguage, texts } = useLanguage();
  const { timeRange, setTimeRange } = useTimeFilter();

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
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 relative z-50">
      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 -ml-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex flex-1 md:ml-0 ml-2">
        <div className="w-full max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            placeholder={texts.common.search + "..."}
            type="search"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Time Filter Dropdown */}
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
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors">
          <Globe size={14} className="text-indigo-500 mr-2 ml-1" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent border-0 outline-none cursor-pointer font-semibold text-slate-700 focus:ring-0 py-0 pr-6 pl-0"
          >
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
            <option value="ar">العربية (AR)</option>
            <option value="de">Deutsch (DE)</option>
            <option value="fr">Français (FR)</option>
            <option value="zh">中文 (ZH)</option>
          </select>
        </div>

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

        {/* User profile */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
          <div className="h-9 w-9 bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 rounded-md">
            <User size={20} />
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-slate-800">{role} User</p>
            <p className="text-slate-500 text-xs">Farm {role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
