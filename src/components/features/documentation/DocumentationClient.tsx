'use client';

import { useState, useEffect } from 'react';
import { DocSection } from './DocSection';
import { BookOpen, LayoutDashboard, Bird, Egg, Wheat, DollarSign, Settings, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const NAV_ITEMS = [
  { id: 'overview', label: 'Platform Overview', icon: BookOpen },
  { id: 'dashboard', label: 'Dashboard Analytics', icon: LayoutDashboard },
  { id: 'flocks', label: 'Flock Management', icon: Bird },
  { id: 'eggs', label: 'Egg Production', icon: Egg },
  { id: 'feed', label: 'Feed & Inventory', icon: Wheat },
  { id: 'finance', label: 'Finance & Ledgers', icon: DollarSign },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

export function DocumentationClient() {
  const [activeSection, setActiveSection] = useState('overview');

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
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Banner Area */}
      <div className="relative w-full h-[40vh] min-h-[300px] bg-slate-900 flex items-center justify-center overflow-hidden">
        <Image 
          src="/docs/docs_hero_banner.png" 
          alt="Documentation Hero" 
          fill 
          className="object-cover opacity-60 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-sm font-medium mb-6 backdrop-blur-md">
            <BookOpen size={16} /> Official Guide v2.0
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
            Comprehensive User Guide
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-medium">
            Everything you need to master your poultry farm operations, from flock tracking to advanced financial analytics.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12 relative">
        
        {/* Sticky Sidebar Navigation */}
        <div className="md:w-72 flex-shrink-0 relative">
          <div className="sticky top-24 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 px-3">Table of Contents</h3>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === id 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={activeSection === id ? 'text-indigo-600' : 'text-slate-400'} />
                    {label}
                  </div>
                  {activeSection === id && <ChevronRight size={16} className="text-indigo-400" />}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-4xl">
          
          <DocSection 
            id="overview" 
            title="Platform Overview" 
            description="Welcome to the Poultry Farm Management System. Our application is designed to be your all-in-one digital command center for farm operations."
          >
            <p>
              The system integrates data from different facets of your farm—flocks, egg production, feed, and finances—into a centralized, real-time dashboard. 
              The application supports <strong>internationalization</strong> (En, Es, Ar, De, Fr, Zh) and offers global <strong>time-range filtering</strong>, allowing you to instantly switch views between weekly, monthly, and yearly analytics.
            </p>
            <div className="mt-6 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-md">
              <h4 className="font-bold text-indigo-900 mb-1">Getting Started</h4>
              <p className="text-indigo-800 text-sm">
                Ensure you have set your preferred language and time range in the top Header navigation bar. Your preferences will be saved automatically across sessions.
              </p>
            </div>
          </DocSection>

          <DocSection 
            id="dashboard" 
            title="Dashboard Analytics" 
            description="The Dashboard acts as your central hub, presenting real-time KPIs and dynamic charts."
            imageSrc="/docs/docs_dashboard.png"
            imageAlt="Dashboard Overview Illustration"
          >
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mt-0.5">1</span>
                <div>
                  <strong>Key Performance Indicators (KPIs):</strong> At a glance, view Total Live Birds, Eggs Collected Today, Revenue, and Mortality Rates. The arrows indicate whether trends are positive or negative compared to the previous period.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mt-0.5">2</span>
                <div>
                  <strong>Dynamic Charting:</strong> The central chart automatically adjusts based on your global time filter. It displays daily bars for weekly views, dates for monthly views, and aggregated months for yearly views.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mt-0.5">3</span>
                <div>
                  <strong>Queue Monitoring:</strong> The dashboard summarizes pending tasks such as Shift Checklists and System Alert Logs.
                </div>
              </li>
            </ul>
          </DocSection>

          <DocSection 
            id="flocks" 
            title="Flock Management" 
            description="Track every batch of birds from day one to depletion."
            imageSrc="/docs/docs_flock.png"
            imageAlt="Flock Management Illustration"
          >
            <p>
              The Flock module allows you to register batches with details such as Breed, Purchase Date, Quantity, and Projected Selling Price.
            </p>
            <h4 className="font-semibold text-slate-800 mt-6 mb-2">Mortality & Health</h4>
            <p>
              When logging mortality, the system automatically subtracts from the total active bird count, ensuring your dashboard KPIs are instantly up to date. You can also view vaccination schedules for each specific batch to ensure farm biosecurity protocols are met.
            </p>
          </DocSection>

          <DocSection 
            id="eggs" 
            title="Egg Production" 
            description="Monitor daily collection, breakage rates, and cushioning audits."
          >
            <p>
              Logging daily egg collections is crucial. The Egg module differentiates between Good Eggs, Cracked Eggs, and Spoilt Eggs. This directly feeds into the revenue projections and the dynamic charts on the Dashboard.
            </p>
            <p className="mt-4 bg-amber-50 p-3 rounded-md text-sm border border-amber-100 text-amber-800">
              <strong>Tip:</strong> Frequently update the "Cushion Audits" to reduce the number of cracked eggs in the nesting boxes.
            </p>
          </DocSection>

          <DocSection 
            id="feed" 
            title="Feed & Inventory" 
            description="Prevent stockouts and analyze consumption."
          >
            <p>
              Track feed deliveries and log daily consumption. The system provides Low Stock Alerts directly to the Dashboard when feed levels drop below critical thresholds. 
            </p>
            <p className="mt-4">
              Proper logging ensures that the Finance module can calculate the true cost of production per bird and per egg.
            </p>
          </DocSection>

          <DocSection 
            id="finance" 
            title="Finance & Ledgers" 
            description="A robust double-entry style ledger and reconciliation sheet."
            imageSrc="/docs/docs_finance.png"
            imageAlt="Financial Analytics Illustration"
          >
            <p>
              The Finance module presents a complete breakdown of operational inflows and outflows.
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-700">
              <li><strong>Expense Ledger:</strong> Categorize spending into Feed, Salaries, Drugs, Utilities, and Maintenance.</li>
              <li><strong>Payroll Processing:</strong> One-click payroll processing calculates total staff salaries and deducts them from the net asset balance.</li>
              <li><strong>Reconciliation Sheet:</strong> A transparent view combining opening bank/cash balances with recent revenues, minus operational expenses, to display the true Reconciled Net Balance Asset.</li>
            </ul>
          </DocSection>

          <DocSection 
            id="settings" 
            title="System Settings" 
            description="Customize your experience and manage workspaces."
          >
            <p>
              Configure system alerts, adjust default language preferences, and manage multiple branches or farms within a single account instance. If you have admin rights, you can invite new personnel via the Staff module.
            </p>
          </DocSection>

        </div>
      </div>
    </div>
  );
}
