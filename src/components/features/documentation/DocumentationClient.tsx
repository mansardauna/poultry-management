'use strict';
'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  LayoutDashboard, 
  Bird, 
  Egg, 
  Wheat, 
  DollarSign, 
  HeartPulse,
  Users,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';

const NAV_ITEMS = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'flock-management', label: 'Flock Management', icon: Bird },
  { id: 'egg-production', label: 'Egg Production', icon: Egg },
  { id: 'feed-inventory', label: 'Feed & Inventory', icon: Wheat },
  { id: 'financial-tracking', label: 'Financial Tracking', icon: DollarSign },
  { id: 'health-cctv', label: 'Health & CCTV', icon: HeartPulse },
  { id: 'staff-contacts', label: 'Staff & Contacts', icon: Users },
];

export function DocumentationClient() {
  const [activeSection, setActiveSection] = useState('getting-started');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    NAV_ITEMS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pt-20 font-sans">
      <LandingNav activePath="/documentation" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-10 relative">
        
        {/* Left Sidebar Navigation */}
        <div className="md:w-64 flex-shrink-0 relative">
          <div className="sticky top-28 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">P</div>
              <span className="font-extrabold text-lg tracking-tight text-indigo-700">PMS Guide</span>
            </div>
            
            <nav className="space-y-1.5">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeSection === id 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={16} className={activeSection === id ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="truncate">{label}</span>
                  </div>
                  {activeSection === id && <ChevronRight size={14} className="shrink-0 text-indigo-600" />}
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">Master Guides</span>
              <a href="/documentation/setup-guide.html" className="block px-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600">Setup Guide →</a>
              <a href="/documentation/administration-guide.html" className="block px-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600">Admin Guide →</a>
              <a href="/documentation/usage-guide.html" className="block px-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600">Usage Guide →</a>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-4xl space-y-8">
          
          {/* Hero Banner Box */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 text-white p-8 md:p-12 rounded-2xl shadow-sm space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Poultry Management System
            </h1>
            <p className="text-sm md:text-base text-indigo-100 font-medium">
              Comprehensive Usage Guide for the Web Version
            </p>
          </div>

          {/* Getting Started Card */}
          <div id="getting-started" className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 scroll-mt-28">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100">Getting Started</h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                Welcome to the Poultry Management System! This guide will walk you through the core functionalities of the application, helping you to efficiently manage your farm's daily operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 border border-indigo-100/80 p-5 rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-indigo-900">Navigation</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Use the left-hand sidebar to navigate between different modules like Dashboard, Flocks, Eggs, and Finance.
                </p>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100/80 p-5 rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-indigo-900">Workspaces</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  If you manage multiple farms, you can switch between them using the Workspace switcher in the top navigation bar.
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Card */}
          <div id="dashboard" className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 scroll-mt-28">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100">Dashboard</h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mb-4">
                The Dashboard provides a high-level, real-time overview of your farm's performance.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                <li><strong>Key Metrics:</strong> View total active birds, daily egg production rates, and recent feed consumption.</li>
                <li><strong>Guided Onboarding:</strong> Track setup progress for newly created farm workspaces.</li>
                <li><strong>System Alerts:</strong> Monitor critical notifications for low feed stock, mortality spikes, and uncollected invoices.</li>
              </ul>
            </div>

            <div className="pt-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img src="/docs/main_dashboard.jpg" alt="Dashboard Screenshot" className="w-full h-auto object-cover" />
              </div>
              <p className="text-[11px] text-slate-400 font-semibold text-center mt-2">Main Telemetry Dashboard Overview</p>
            </div>
          </div>

          {/* Flock Management Card */}
          <div id="flock-management" className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 scroll-mt-28">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100">Flock Management</h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Track every batch of birds from day one to depletion.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                <li><strong>Batches & Flocks:</strong> Register layers, broilers, and pullets with unique batch IDs and breeds.</li>
                <li><strong>Mortality Logger:</strong> Record daily mortality count with root-cause analysis (heat stress, disease, natural).</li>
                <li><strong>Pen Transfers:</strong> Reassign flocks between housing coops and pens seamlessly.</li>
              </ul>
            </div>
          </div>

          {/* Egg Production Card */}
          <div id="egg-production" className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 scroll-mt-28">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100">Egg Production</h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Monitor daily collection, breakage rates, and cushioning audits.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-slate-600 font-medium">
                <li><strong>Daily Collections:</strong> Log good eggs, cracked eggs, and spoilt eggs per batch.</li>
                <li><strong>30-Egg Crate Conversion:</strong> Automatically converts total good eggs to standard 30-egg crates.</li>
                <li><strong>Cushion Audits:</strong> Track nesting box padding cleanliness to reduce cracked shell occurrences.</li>
              </ul>
            </div>

            <div className="pt-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img src="/docs/egg_logger.jpg" alt="Egg Logger Screenshot" className="w-full h-auto object-cover" />
              </div>
              <p className="text-[11px] text-slate-400 font-semibold text-center mt-2">Egg Collection & Maturation Logger</p>
            </div>
          </div>

          {/* Financial Tracking Card */}
          <div id="financial-tracking" className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 scroll-mt-28">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100">Financial Tracking</h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mb-4">
                Complete expense ledgers, sales invoicing, and profit & loss statements.
              </p>
            </div>

            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img src="/docs/settings_view.jpg" alt="Settings View Screenshot" className="w-full h-auto object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img src="/docs/subscription_modal.jpg" alt="Subscription Modal Screenshot" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>

        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
