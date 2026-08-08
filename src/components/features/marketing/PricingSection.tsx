'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Zap, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface SaasPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  maxBranches: number;
  cctvEnabled: boolean;
  aiLoggerEnabled: boolean;
  exportReportsEnabled: boolean;
  enterpriseHubEnabled: boolean;
  features: string[];
}

const DEFAULT_PLANS: SaasPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    description: 'Perfect for small backyard farms.',
    priceMonthly: 0,
    priceAnnual: 0,
    maxBranches: 1,
    cctvEnabled: false,
    aiLoggerEnabled: false,
    exportReportsEnabled: false,
    enterpriseHubEnabled: false,
    features: ['1 Farm Branch', 'Up to 2 Staff Members', 'Basic AI Logger', '30-day Data Retention']
  },
  {
    id: 'pro',
    name: 'Commercial Pro',
    description: 'For commercial farms scaling up.',
    priceMonthly: 15000,
    priceAnnual: 144000,
    maxBranches: 5,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: false,
    features: ['Unlimited Farm Branches', 'Unlimited Staff & Managers', 'Voice-Powered AI Logger', 'CCTV Monitoring & Alerts', 'Google Pay Supported']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plus',
    description: 'Multi-farm enterprises & agricultural cooperatives.',
    priceMonthly: 45000,
    priceAnnual: 432000,
    maxBranches: 999,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: true,
    features: ['Multi-Farm Enterprise Management Hub', 'Cooperative White-Label Portal & Custom Branding', '24/7 Priority Consultant Hotline & Custom API Access']
  }
];

export function PricingSection() {
  const router = useRouter();
  const [plans, setPlans] = useState<SaasPlan[]>(DEFAULT_PLANS);

  useEffect(() => {
    fetch('/api/admin/plans', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch(() => {});
  }, []);

  const handlePurchase = (planId: string) => {
    router.push(`/signup?plan=${planId}`);
  };

  return (
    <section id="pricing" className="py-24 bg-white border-t border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-slate-500 mb-16 max-w-2xl mx-auto font-normal">
          Choose the plan that fits your farm's size and needs. Upgrade anytime as your flock grows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => {
            const isFeatured = plan.id === 'pro';

            return (
              <div 
                key={plan.id}
                className={`p-8 rounded-3xl text-left flex flex-col justify-between transition-all ${
                  isFeatured 
                    ? 'bg-slate-900 border border-indigo-500 text-white shadow-2xl relative transform md:-translate-y-4' 
                    : 'bg-slate-50 border border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                <div>
                  {isFeatured && (
                    <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Zap size={14} /> Most Popular
                    </div>
                  )}

                  <h3 className={`text-xl font-bold mb-2 ${isFeatured ? 'text-white' : 'text-slate-800'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 min-h-[40px] ${isFeatured ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className={`text-4xl md:text-5xl font-extrabold ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                      ₦{plan.priceMonthly.toLocaleString()}
                    </span>
                    <span className={isFeatured ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>/mo</span>
                  </div>

                  <button 
                    onClick={() => handlePurchase(plan.id)}
                    className={`w-full py-3 rounded-full font-bold transition-all mb-8 shadow-sm cursor-pointer ${
                      isFeatured 
                        ? 'bg-indigo-500 border border-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/30' 
                        : plan.id === 'free'
                        ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plan.id === 'free' ? 'Get Started' : plan.id === 'pro' ? 'Start Pro Trial' : 'Get Enterprise'}
                  </button>

                  <ul className="space-y-4 text-sm mb-6">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, i) => (
                        <li key={i} className={`flex items-start gap-3 ${isFeatured ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                          <CheckCircle2 className={isFeatured ? "text-emerald-400 flex-shrink-0" : "text-indigo-600 flex-shrink-0"} size={20} />
                          <span>{feature}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className={`flex items-start gap-3 ${isFeatured ? 'text-slate-300' : 'text-slate-700'}`}>
                          <CheckCircle2 className={isFeatured ? "text-emerald-400 flex-shrink-0" : "text-indigo-600 flex-shrink-0"} size={20} />
                          <span>{plan.maxBranches >= 999 ? 'Unlimited Farm Branches' : `${plan.maxBranches} Farm Branch`}</span>
                        </li>
                        <li className={`flex items-start gap-3 ${isFeatured ? 'text-slate-300' : 'text-slate-700'}`}>
                          {plan.cctvEnabled ? (
                            <CheckCircle2 className={isFeatured ? "text-emerald-400 flex-shrink-0" : "text-indigo-600 flex-shrink-0"} size={20} />
                          ) : (
                            <X className="text-slate-400 flex-shrink-0" size={20} />
                          )}
                          <span className={!plan.cctvEnabled ? 'line-through text-slate-400' : ''}>CCTV Live Surveillance</span>
                        </li>
                        <li className={`flex items-start gap-3 ${isFeatured ? 'text-slate-300' : 'text-slate-700'}`}>
                          {plan.aiLoggerEnabled ? (
                            <CheckCircle2 className={isFeatured ? "text-emerald-400 flex-shrink-0" : "text-indigo-600 flex-shrink-0"} size={20} />
                          ) : (
                            <X className="text-slate-400 flex-shrink-0" size={20} />
                          )}
                          <span className={!plan.aiLoggerEnabled ? 'line-through text-slate-400' : ''}>Voice AI Auto-Logger</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
