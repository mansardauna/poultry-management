'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

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

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, isAnnual })
      });

      if (res.status === 401) {
        toast.error('Please sign up or log in to upgrade');
        router.push(`/signup?plan=${planId}`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      toast.error('An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600">
            <span>🐓 Poultry Management System</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link href="/pricing" className="text-indigo-600 font-semibold">Pricing</Link>
            <Link href="/about" className="hover:text-indigo-600 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
            <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-16">
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Flexible Pricing Plans
        </span>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight sm:text-5xl mt-4">
          Transparent plans for every farm scale
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600 mx-auto">
          Scale effortlessly from a single commercial barn to multi-farm cooperative enterprise hubs.
        </p>

        {/* Toggle Annual/Monthly */}
        <div className="mt-8 flex justify-center items-center gap-3">
          <span className={`text-sm font-semibold ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
          <button 
            type="button" 
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAnnual ? 'bg-indigo-600' : 'bg-slate-200'}`}
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm font-semibold ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
            Annually <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Save 20%</span>
          </span>
        </div>

        {/* Dynamic Plans Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => {
            const price = isAnnual 
              ? Math.round(plan.priceAnnual / 12) 
              : plan.priceMonthly;
            const isFeatured = plan.id === 'pro';

            return (
              <div 
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all ${
                  isFeatured 
                    ? 'bg-indigo-900 text-white shadow-2xl border border-indigo-700 md:-translate-y-2' 
                    : 'bg-white text-slate-900 shadow-md border border-slate-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className={`text-2xl font-bold ${isFeatured ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h2>
                    {isFeatured && (
                      <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className={`text-xs min-h-[36px] ${isFeatured ? 'text-indigo-200' : 'text-slate-500'}`}>{plan.description}</p>
                  
                  <div className="my-6">
                    <span className={`text-4xl font-extrabold ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                      ₦{price.toLocaleString()}
                    </span>
                    <span className={`text-xs font-medium ${isFeatured ? 'text-indigo-300' : 'text-slate-500'}`}>/month</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-left text-xs">
                    <li className="flex items-center gap-2">
                      <Check className={isFeatured ? "text-emerald-400" : "text-emerald-500"} size={16} />
                      <span>{plan.maxBranches >= 999 ? 'Unlimited Farm Branches' : `Up to ${plan.maxBranches} Farm Branch${plan.maxBranches > 1 ? 'es' : ''}`}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.cctvEnabled ? <Check className={isFeatured ? "text-emerald-400" : "text-emerald-500"} size={16} /> : <X className="text-slate-400" size={16} />}
                      <span className={!plan.cctvEnabled ? 'line-through text-slate-400' : ''}>CCTV Live Surveillance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.aiLoggerEnabled ? <Check className={isFeatured ? "text-emerald-400" : "text-emerald-500"} size={16} /> : <X className="text-slate-400" size={16} />}
                      <span className={!plan.aiLoggerEnabled ? 'line-through text-slate-400' : ''}>Voice AI Auto-Logger</span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.exportReportsEnabled ? <Check className={isFeatured ? "text-emerald-400" : "text-emerald-500"} size={16} /> : <X className="text-slate-400" size={16} />}
                      <span className={!plan.exportReportsEnabled ? 'line-through text-slate-400' : ''}>PDF & CSV Export Reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.enterpriseHubEnabled ? <Check className={isFeatured ? "text-emerald-400" : "text-emerald-500"} size={16} /> : <X className="text-slate-400" size={16} />}
                      <span className={!plan.enterpriseHubEnabled ? 'line-through text-slate-400' : ''}>Enterprise Cooperative Portal & API</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={`w-full font-semibold text-xs py-3 rounded-xl transition-all shadow-sm cursor-pointer ${
                    isFeatured
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                      : plan.id === 'free'
                      ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isLoading ? 'Processing...' : plan.id === 'free' ? 'Get Started Free' : `Select ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
