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
  Settings, 
  ChevronRight, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Camera, 
  HelpCircle,
  FileText,
  CreditCard,
  Megaphone,
  Home,
  HeartPulse,
  ShoppingBag,
  Wrench,
  Users,
  UserCheck
} from 'lucide-react';
import Image from 'next/image';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';

const NAV_ITEMS = [
  { id: 'summary', label: '1. Executive Summary', icon: BookOpen },
  { id: 'sitemap', label: '2. Sitemap Architecture', icon: FileText },
  { id: 'screenshots', label: '3. Real App Screenshots', icon: Camera },
  { id: 'wireframes', label: '4. Module Wireframes (1-14)', icon: LayoutDashboard },
  { id: 'subscriptions', label: '5. Subscription Tier Matrix', icon: CreditCard },
  { id: 'marketing', label: '6. Digital Marketer Pitch Copy', icon: Megaphone },
];

export function DocumentationClient() {
  const [activeSection, setActiveSection] = useState('summary');

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-20 font-sans">
      <LandingNav activePath="/documentation" />
      
      {/* Hero Banner Area */}
      <div className="relative w-full bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <BookOpen size={14} /> Official Product & Marketing Guide v2.0
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Poultry Farm Management System (PFMS)
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
            Complete Product Feature, Sitemap, Wireframe Layouts, Real App Screenshots, Subscription Tier Matrix, and Digital Marketer Pitch Copy.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-10 relative">
        
        {/* Sticky Sidebar Navigation */}
        <div className="md:w-72 flex-shrink-0 relative">
          <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4 px-2">Documentation Menu</h3>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === id 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={16} />
                    <span className="truncate">{label}</span>
                  </div>
                  {activeSection === id && <ChevronRight size={14} className="shrink-0" />}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-4xl space-y-16">
          
          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <section id="summary" className="space-y-6 scroll-mt-28">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Page 1 of 10</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">🌟 Executive Summary & Core Value Proposition</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <strong>Poultry Farm Management System (PFMS)</strong> is an end-to-end, enterprise-grade cloud SaaS platform tailored for commercial poultry farmers, layer & broiler operators, hatchery managers, and agricultural cooperatives.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <h4 className="text-xs font-bold text-indigo-600 uppercase">1. Automated Livestock Telemetry</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Real-time tracking of flock mortality, laying percentages, feed conversion ratios (FCR), and maturation timelines.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-600 uppercase">2. Financial Precision</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Automated cashflow tracking, merchant invoice generation, expense categorization, and batch-level profitability.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <h4 className="text-xs font-bold text-amber-600 uppercase">3. Hardware & AI Integration</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">WebRTC live CCTV camera surveillance, optical AI barcode parsing, and automated threshold alerts.</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                <h4 className="text-xs font-bold text-purple-600 uppercase">4. Multi-Farm Expansion</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Multi-branch matrix management, inter-branch stock transfers, and 100% customizable white-label branding.</p>
              </div>
            </div>
          </section>

          {/* SECTION 2: SITEMAP ARCHITECTURE */}
          <section id="sitemap" className="space-y-6 scroll-mt-28">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Page 1 of 10</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">🧭 Sitemap & Application Navigation Architecture</h2>
            </div>

            <div className="bg-slate-900 text-indigo-300 p-6 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
<pre>{`Public Landing & Onboarding
 ├── /                       -> Public Commercial Landing Page
 ├── /pricing                -> Subscription Plans & Feature Matrix
 ├── /about                  -> About Company & Mission
 ├── /contact                -> Contact & Support Form
 ├── /login                  -> Unified Single-Farm & Enterprise Portal
 ├── /signup                 -> User Registration & Trial Initialization
 └── /reset-password         -> Password Recovery

Authenticated Operational Dashboard (/dashboard)
 ├── Main Telemetry          -> Real-time KPIs, Alert Logs, & Onboarding Widget
 ├── /dashboard/chickens     -> Flock Batches, Breeds, Mortality, & Transfers
 ├── /dashboard/housing      -> Pen Coops, Capacity Allocation, & Climate Status
 ├── /dashboard/eggs         -> Daily Egg Collections, Cushion Audits, & Maturation
 ├── /dashboard/feed         -> Feed Inventory, Daily Consumption Logs, & Restock Pipeline
 ├── /dashboard/health       -> Vaccination Templates, Booster Schedules, & Vet Logs
 ├── /dashboard/sales        -> Sales Records, Paystack/Stripe Invoices, & Customer Orders
 ├── /dashboard/finance      -> Expense Ledger, Payroll Disbursement, & Profit/Loss
 ├── /dashboard/inventory    -> Farm Machinery, Tools, Equipment Maintenance
 ├── /dashboard/staff        -> Attendant Roster, Role-Based Access (Admin/Manager/Staff)
 ├── /dashboard/contacts     -> Supplier & Buyer CRM Directory
 ├── /dashboard/cctv         -> WebRTC Security Camera Monitoring & QR Pairing
 ├── /dashboard/enterprise   -> Multi-Branch Matrix, White-Label Branding, & Vet Hotline
 │    ├── /branches          -> Multi-Farm Matrix & Inter-Branch Stock Transfers
 │    ├── /whitelabel        -> Custom Logo, Subdomains, & Color Schemes
 │    ├── /api               -> REST API Tokens & Webhook Integration
 │    ├── /vet               -> 24/7 Priority Veterinary Hotline Tickets
 │    └── /feed-pool         -> Cooperative Wholesale Feed Purchasing Pool
 ├── /dashboard/settings     -> Account Settings, Branch Setup, & Billing Plans
 └── /dashboard/admin        -> Super Admin Portal & Landing Page CMS Editor`}</pre>
            </div>
          </section>

          {/* SECTION 3: REAL APP SCREENSHOTS */}
          <section id="screenshots" className="space-y-6 scroll-mt-28">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Page 2 & 9 Screenshots</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">📸 Real Application Screenshots</h2>
            </div>

            <div className="space-y-8">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Main Telemetry Dashboard (`/dashboard`)</h4>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src="/docs/main_dashboard.jpg" alt="Main Dashboard Screenshot" className="w-full h-auto object-cover" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Login Portal (`/login`)</h4>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img src="/docs/login_page.png" alt="Login Portal Screenshot" className="w-full h-auto object-cover" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Egg Collection Logger (`/dashboard/eggs`)</h4>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img src="/docs/egg_logger.jpg" alt="Egg Logger Screenshot" className="w-full h-auto object-cover" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Subscription Upgrade Modal & Settings (`/settings`)</h4>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src="/docs/subscription_modal.jpg" alt="Subscription Modal Screenshot" className="w-full h-auto object-cover" />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: MODULE WIREFRAMES */}
          <section id="wireframes" className="space-y-8 scroll-mt-28">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Pages 3 to 8 Wireframes</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">📦 Detailed Module-by-Module Wireframe Breakdown</h2>
            </div>

            {/* 1. Main Dashboard */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">1. Main Telemetry Dashboard</h3>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded">ADMIN / MANAGER</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Aggregates core active flock birds, 30-egg crate counts, feed stock remaining (Kg), and operational net revenue.</p>
              <div className="bg-slate-900 text-sky-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
<pre>{`+-------------------------------------------------------------------------------+
| [Search Bar]               [Time Filter: All/Weekly] [Language] [Bell (9+)]  |
+-------------------------------------------------------------------------------+
| ⚡ FARM SETUP & ONBOARDING PROGRESS (0 of 4 Completed - 0%)                   |
| Progress Bar [==========] 0%   [Resume Step 1: Configure Branch ->]           |
+-------------------------------------------------------------------------------+
| [Active Birds: 12,500] [Egg Production: 410 Crates] [Feed Stock: 1,850 Kg]    |
+-------------------------------------------------------------------------------+
| [Egg Production Bar Chart (Daily)]     | [Net Revenue vs Expenses Line Chart] |
+-------------------------------------------------------------------------------+
| Recent Alert Notifications Log (Critical / Warning / Info)                    |
+-------------------------------------------------------------------------------`}</pre>
              </div>
            </div>

            {/* 4. Egg Production */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">4. Egg Production & Daily Collections</h3>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded">ADMIN / MANAGER / STAFF</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Logs daily laying counts, cracked vs good eggs, and automatically converts counts to standard 30-egg crates.</p>
              <div className="bg-slate-900 text-sky-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
<pre>{`+-------------------------------------------------------------------------------+
| EGG PRODUCTION & COLLECTION LOGS                            [+ Log Daily Lay] |
+-------------------------------------------------------------------------------+
| Collection Date | Batch ID | Good Eggs | Cracked | Total Crates | Nest Audit  |
| 2026-08-22      | B301     | 4,200     | 18      | 140 Crates   | 95% Clean   |
+-------------------------------------------------------------------------------`}</pre>
              </div>
            </div>

            {/* 7. Sales & Merchant Invoices */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">7. Sales & Merchant Invoices</h3>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded">ADMIN / MANAGER</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Record egg crate and live bird sales, generate digital invoices, and share WhatsApp Paystack/Stripe payment links.</p>
              <div className="bg-slate-900 text-sky-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
<pre>{`+-------------------------------------------------------------------------------+
| SALES & INVOICE MANAGEMENT                             [+ Record New Sale]    |
+-------------------------------------------------------------------------------+
| Invoice # | Customer Name      | Product   | Amount (₦) | Status   | Payment  |
| INV-8021  | Maitama Supermarket| 50 Crates | ₦175,000   | [Paid]   | Paystack |
| INV-8022  | Grand Hotel Ltd    | 100 Birds | ₦450,000   | [Unpaid] | [Pay Link|
+-------------------------------------------------------------------------------`}</pre>
              </div>
            </div>
          </section>

          {/* SECTION 5: SUBSCRIPTION TIER MATRIX */}
          <section id="subscriptions" className="space-y-6 scroll-mt-28">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Page 9 of 10</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">💳 Subscription Tier Matrix</h2>
            </div>

            <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-900 text-white font-extrabold uppercase">
                  <tr>
                    <th className="p-4">Feature / Capability</th>
                    <th className="p-4">Free Account</th>
                    <th className="p-4 text-emerald-400">Commercial Pro</th>
                    <th className="p-4 text-indigo-400">Enterprise Plus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-4 font-bold text-slate-900">Max Farm Branches</td>
                    <td className="p-4">1 Branch</td>
                    <td className="p-4 text-emerald-600 font-bold">Unlimited</td>
                    <td className="p-4 text-indigo-600 font-bold">Unlimited Multi-Farm Matrix</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900">Flock Batches</td>
                    <td className="p-4">Basic</td>
                    <td className="p-4 text-emerald-600 font-bold">Unlimited</td>
                    <td className="p-4 text-indigo-600 font-bold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900">CCTV Surveillance</td>
                    <td className="p-4 text-slate-400">Locked 🔒</td>
                    <td className="p-4">2 Cameras</td>
                    <td className="p-4 text-indigo-600 font-bold">Unlimited WebRTC Cameras</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-900">White-Label Suite</td>
                    <td className="p-4 text-slate-400">Locked 🔒</td>
                    <td className="p-4 text-slate-400">Locked 🔒</td>
                    <td className="p-4 text-indigo-600 font-bold">Full Custom Logo & Theme</td>
                  </tr>
                  <tr className="bg-slate-50 font-extrabold text-sm">
                    <td className="p-4 text-slate-900">Pricing</td>
                    <td className="p-4 text-slate-700">Free Forever</td>
                    <td className="p-4 text-emerald-600">₦15,000 / month</td>
                    <td className="p-4 text-indigo-600">₦45,000 / month</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 6: DIGITAL MARKETER AD COPY */}
          <section id="marketing" className="space-y-6 scroll-mt-28">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Page 9 & 10</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">📣 Digital Marketer Pitching Points & Ad Copy Suggestions</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                <h4 className="text-sm font-extrabold text-slate-900">1. "STOP LOSING MONEY ON EGG & FEED LEAKAGE"</h4>
                <p className="text-xs text-slate-600 font-medium"><strong>Hook:</strong> <em>"Are unrecorded egg mortalities and feed wastage shrinking your farm profits?"</em></p>
                <p className="text-xs text-indigo-600 font-bold"><strong>Solution:</strong> PFMS automates daily egg lay logs, crate calculations, and low-stock feed alerts in 1 click.</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                <h4 className="text-sm font-extrabold text-slate-900">2. "MANAGE 5 FARM BRANCHES FROM YOUR PHONE"</h4>
                <p className="text-xs text-slate-600 font-medium"><strong>Hook:</strong> <em>"Scaling your poultry farm to multiple locations?"</em></p>
                <p className="text-xs text-indigo-600 font-bold"><strong>Solution:</strong> Switch between regional farm branches seamlessly, transfer stock between pens, and monitor live CCTV feeds from anywhere in the world.</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                <h4 className="text-sm font-extrabold text-slate-900">3. "PROFESSIONAL PAYSTACK & STRIPE INVOICING FOR FARMERS"</h4>
                <p className="text-xs text-slate-600 font-medium"><strong>Hook:</strong> <em>"Tired of manual paper receipts for wholesale egg buyers?"</em></p>
                <p className="text-xs text-indigo-600 font-bold"><strong>Solution:</strong> Generate instant digital invoices with Paystack/Stripe online payment links directly on WhatsApp.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
