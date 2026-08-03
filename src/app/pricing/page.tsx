'use strict';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, isAnnual })
      });
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
          Choose the plan that fits your farm's needs. Upgrade anytime to unlock advanced features.
        </p>

        <div className="mt-8 flex justify-center items-center gap-3">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
          <button 
            type="button" 
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${isAnnual ? 'bg-indigo-600' : 'bg-slate-200'}`}
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Annually (Save 20%)</span>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 flex flex-col">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Free Starter</h2>
            <p className="text-slate-500 mb-6">Perfect for small backyard farms just getting started.</p>
            <div className="text-5xl font-extrabold text-slate-900 mb-8">
              ₦0<span className="text-xl font-medium text-slate-500">/mo</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 text-left">
              <li className="flex items-center gap-3"><Check className="text-emerald-500" size={20} /> <span className="text-slate-600">1 Farm Branch (Workspace)</span></li>
              <li className="flex items-center gap-3"><Check className="text-emerald-500" size={20} /> <span className="text-slate-600">Up to 2 Staff Members</span></li>
              <li className="flex items-center gap-3"><Check className="text-emerald-500" size={20} /> <span className="text-slate-600">Basic Text AI Logger</span></li>
              <li className="flex items-center gap-3"><Check className="text-emerald-500" size={20} /> <span className="text-slate-600">30-day Data Retention</span></li>
              <li className="flex items-center gap-3 opacity-50"><X className="text-slate-400" size={20} /> <span className="text-slate-500 line-through">CCTV Monitoring Integration</span></li>
            </ul>

            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-slate-100 text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-indigo-900 rounded-3xl shadow-2xl border border-indigo-700 p-8 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Commercial Pro</h2>
            <p className="text-indigo-200 mb-6">For serious commercial farms needing advanced insights.</p>
            <div className="text-5xl font-extrabold text-white mb-8">
              {isAnnual ? '₦12,000' : '₦15,000'}
              <span className="text-xl font-medium text-indigo-300">/mo</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 text-left">
              <li className="flex items-center gap-3"><Check className="text-blue-400" size={20} /> <span className="text-indigo-50">Unlimited Farm Branches</span></li>
              <li className="flex items-center gap-3"><Check className="text-blue-400" size={20} /> <span className="text-indigo-50">Unlimited Staff & Managers</span></li>
              <li className="flex items-center gap-3"><Check className="text-blue-400" size={20} /> <span className="text-indigo-50">Voice-Powered AI Auto Logger</span></li>
              <li className="flex items-center gap-3"><Check className="text-blue-400" size={20} /> <span className="text-indigo-50">Unlimited Data Retention</span></li>
              <li className="flex items-center gap-3"><Check className="text-blue-400" size={20} /> <span className="text-indigo-50">CCTV Monitoring & Real-time Alerts</span></li>
            </ul>

            <button 
              onClick={() => handleSubscribe('pro')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-colors shadow-lg shadow-indigo-900/50 disabled:opacity-70"
            >
              {isLoading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
