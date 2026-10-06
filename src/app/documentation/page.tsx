'use strict';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  ShieldCheck, 
  Server, 
  ExternalLink, 
  Search, 
  Layers, 
  Egg, 
  Wheat, 
  DollarSign, 
  Video, 
  FileText, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { useLanguage } from '@/components/features/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export default function DocumentationPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'staff' | 'admin' | 'superadmin'>('all');

  const ROLE_GUIDES = [
    {
      id: 'staff',
      role: 'staff',
      title: t("Staff Usage Guide"),
      badge: "Role Manual 01",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      description: t("Step-by-step visual button click instructions for flock attendants, egg collectors, and feed loggers.", "Step-by-step visual instructions for flock attendants, egg collectors, and feed loggers."),
      htmlHref: "/documentation/usage-guide.html",
      icon: Users,
      iconColor: "text-amber-600 bg-amber-50",
      topics: [
        { name: t("Egg Collection Logging", "Egg Collection Logging"), icon: Egg },
        { name: t("Feed Stock Usage & Restock", "Feed Stock Usage & Restock"), icon: Wheat },
        { name: t("Shift Checklist & Daily Tasks", "Shift Checklist & Daily Tasks"), icon: CheckCircle2 },
        { name: t("Mortality & Health Incident Logs", "Mortality & Health Incident Logs"), icon: FileText }
      ]
    },
    {
      id: 'admin',
      role: 'admin',
      title: t("Admin Governance Guide"),
      badge: "Role Manual 02",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      description: t("Operational and commercial management manual covering flock batches, pen houses, sales invoicing, and financial accounting.", "Operational and commercial management manual covering flock batches, pen houses, sales invoicing, and financial accounting."),
      htmlHref: "/documentation/administration-guide.html",
      icon: ShieldCheck,
      iconColor: "text-indigo-600 bg-indigo-50",
      topics: [
        { name: t("Flock Batches & Pen Allocation", "Flock Batches & Pen Allocation"), icon: Layers },
        { name: t("Sales Ledger & Paystack / Stripe Invoices", "Sales Ledger & Paystack / Stripe Invoices"), icon: DollarSign },
        { name: t("Expense Categorization & Profit Analysis", "Expense Categorization & Profit Analysis"), icon: FileText },
        { name: t("Staff Access Control & Attendance Roster", "Staff Access Control & Attendance Roster"), icon: Users }
      ]
    },
    {
      id: 'superadmin',
      role: 'superadmin',
      title: t("Superadmin Setup Guide"),
      badge: "Master Manual 03",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      description: t("Platform architecture, multi-tenant workspace isolation, payment gateway credentials, and SaaS subscription tiers.", "Platform architecture, multi-tenant workspace isolation, payment gateway credentials, and SaaS subscription tiers."),
      htmlHref: "/documentation/superadmin-setup-guide.html",
      icon: Server,
      iconColor: "text-purple-600 bg-purple-50",
      topics: [
        { name: t("Multi-Tenant Isolation Architecture", "Multi-Tenant Isolation Architecture"), icon: Server },
        { name: t("Paystack & Stripe API Gateway Setup", "Paystack & Stripe API Gateway Setup"), icon: DollarSign },
        { name: t("Landing Page CMS & Announcements", "Landing Page CMS & Announcements"), icon: Sparkles },
        { name: t("CCTV RTSP & AI Surveillance", "CCTV RTSP & AI Surveillance"), icon: Video }
      ]
    }
  ];

  const filteredGuides = ROLE_GUIDES.filter((guide) => {
    const matchesRole = selectedRole === 'all' || guide.role === selectedRole;
    const matchesSearch = !searchQuery || 
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.topics.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      <LandingNav activePath="/documentation" />

      <main className="pt-28 pb-20 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-widest">
              <BookOpen size={16} />
              <span>{t("Documentation Portal")}</span>
            </div>
            <div>
              <LanguageSelector variant="dark" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight max-w-3xl leading-tight">
            {t("Role-Based Documentation & Visual Operations Manual")}
          </h1>
          <p className="text-sm sm:text-base text-indigo-100 max-w-2xl font-medium leading-relaxed">
            {t("Welcome to the Poultry Management System documentation portal. Choose your role guide below to view step-by-step visual button click instructions with screenshots.")}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">{t("Filter")}:</span>
            <button
              onClick={() => setSelectedRole('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedRole === 'all' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t("All Time", "All Guides")}
            </button>
            <button
              onClick={() => setSelectedRole('staff')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedRole === 'staff' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t("Staff Usage Guide")}
            </button>
            <button
              onClick={() => setSelectedRole('admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedRole === 'admin' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t("Admin Governance Guide")}
            </button>
            <button
              onClick={() => setSelectedRole('superadmin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedRole === 'superadmin' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t("Superadmin Setup Guide")}
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search guides & topics...", "Search guides & topics...")}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
            />
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredGuides.map((guide) => {
            const Icon = guide.icon;

            return (
              <div 
                key={guide.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${guide.badgeColor}`}>
                      {guide.badge}
                    </span>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${guide.iconColor}`}>
                      <Icon size={24} />
                    </div>
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3">
                    {guide.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-6">
                    {guide.description}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      {t("Key Operational Sections", "Key Operational Sections")}
                    </span>
                    {guide.topics.map((topic, idx) => {
                      const TopicIcon = topic.icon;
                      return (
                        <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <TopicIcon size={14} className="text-indigo-600 shrink-0" />
                          <span className="truncate">{topic.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-8">
                  <a 
                    href={guide.htmlHref}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-indigo-600/25 active:scale-95 cursor-pointer"
                  >
                    <span>{t("Open Guide →")}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick FAQ / Help Footer Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900">
              {t("Need help deploying or training staff?", "Need help deploying or training staff?")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
              {t("Our specialized agronomy and software engineers provide 24/7 technical onboarding for farms across all regions.", "Our specialized agronomy and software engineers provide 24/7 technical onboarding for farms across all regions.")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/contact"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
            >
              {t("Contact")}
            </Link>
            <a 
              href="/documentation/index.html"
              target="_blank"
              rel="noreferrer"
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-6 py-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <span>{t("Browse Visual Index", "Browse Visual Index")}</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

      </main>

      <LandingFooter />
    </div>
  );
}
