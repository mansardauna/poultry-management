'use client';

import React from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export function PricingSection() {
  const config = {
    public_key: 'FLWPUBK_TEST-1234567890abcdef-X', // Dummy test key
    tx_ref: Date.now().toString(),
    amount: 39,
    currency: 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: 'manager@poultryfarm.com',
      phone_number: '08000000000',
      name: 'Farm Manager',
    },
    customizations: {
      title: 'PFMS Pro Subscription',
      description: 'Monthly AI-Powered Dashboard Access',
      logo: 'https://cdn-icons-png.flaticon.com/512/826/826955.png', 
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    handleFlutterPayment({
      callback: (response) => {
        if (response.status === 'successful') {
            toast.success("Payment successful! Welcome to Pro.");
        } else {
            toast.error("Payment failed.");
        }
        closePaymentModal();
      },
      onClose: () => {
        // Handle modal close
      },
    });
  };

  return (
    <section id="pricing" className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-slate-500 mb-16 max-w-2xl mx-auto">
          Choose the plan that fits your farm's size and needs. Upgrade anytime as your flock grows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {/* Starter Plan */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-left">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Starter</h3>
            <p className="text-slate-500 text-sm mb-6">Perfect for small backyard farms.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">$15</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <button className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-full font-medium hover:bg-slate-50 transition-colors mb-8">
              Select Starter
            </button>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3"><CheckCircle2 className="text-indigo-500" size={20} /> Up to 500 birds</li>
              <li className="flex gap-3"><CheckCircle2 className="text-indigo-500" size={20} /> Basic egg tracking</li>
              <li className="flex gap-3"><CheckCircle2 className="text-indigo-500" size={20} /> Standard support</li>
            </ul>
          </div>

          {/* Pro Plan (Active) */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-indigo-500 text-left transform md:-translate-y-4 shadow-2xl relative">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap size={14} /> Most Popular
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-slate-400 text-sm mb-6">For commercial farms scaling up.</p>
            <div className="mb-6 text-white">
              <span className="text-5xl font-extrabold">$39</span>
              <span className="text-slate-400">/mo</span>
            </div>
            <button 
              onClick={handlePayment}
              className="w-full bg-indigo-500 border border-indigo-500 text-white py-3 rounded-full font-bold hover:bg-indigo-600 transition-colors mb-8 shadow-lg shadow-indigo-500/30"
            >
              Purchase Pro
            </button>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> Unlimited birds</li>
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> AI Yield Predictions</li>
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> CCTV & NVR Integration</li>
              <li className="flex gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> Priority 24/7 support</li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-left">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Enterprise</h3>
            <p className="text-slate-500 text-sm mb-6">Custom solutions for massive operations.</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">$199</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <button className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-full font-medium hover:bg-slate-50 transition-colors mb-8">
              Contact Sales
            </button>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3"><CheckCircle2 className="text-indigo-500" size={20} /> Multiple farm branches</li>
              <li className="flex gap-3"><CheckCircle2 className="text-indigo-500" size={20} /> Custom AI models</li>
              <li className="flex gap-3"><CheckCircle2 className="text-indigo-500" size={20} /> Dedicated account manager</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
