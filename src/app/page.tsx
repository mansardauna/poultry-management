'use strict';
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Shield, BarChart3, Zap, MessageSquare, PlayCircle, CheckCircle2, Star, Plus, Egg, Wheat, TrendingUp } from 'lucide-react';
import { PricingSection } from '@/components/features/marketing/PricingSection';
import { FAQSection } from '@/components/features/marketing/FAQSection';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasSession = document.cookie.includes('pfms_workspace') || document.cookie.includes('pfms_org_id');
    if (hasSession) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navigation */}
      <LandingNav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Soft UI Background Gradient */}
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-indigo-50 via-white to-rose-50/50 -z-10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-rose-200/40 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-[1.1]">
            AI-Driven poultry farms with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">human-level</span> precision
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Empower your farm managers with AI-driven insights to help them track flock health, predict egg yields, and perform at peak efficiency.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            {isLoggedIn ? (
              <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full text-base font-semibold transition-all shadow-xl shadow-indigo-600/25 active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full text-base font-semibold transition-all shadow-xl shadow-indigo-600/25 active:scale-95 w-full sm:w-auto">
                  Get Started Free
                </Link>
                <Link href="/login" className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 px-8 py-4 rounded-full text-base font-semibold transition-all shadow-sm active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2">
                  Log In to Account
                </Link>
              </>
            )}
          </div>

          {/* Interactive UI Graphic (CSS Only) */}
          <div className="relative max-w-4xl mx-auto h-[400px] md:h-[500px]">
            {/* Center Main Card */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 md:w-96 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 z-20 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-400 to-orange-300 shadow-inner mb-4 flex items-center justify-center text-white font-bold text-xl ring-4 ring-rose-50">
                <Egg className="w-8 h-8"/>
              </div>
              <h3 className="font-bold text-lg mb-1">Flock Health & Yield</h3>
              <p className="text-xs text-slate-400 mb-6 text-center">Create accurate and fast egg yield predictions to maximize ROI.</p>
              
              <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                   <Zap size={16} className="text-indigo-600" />
                 </div>
                 <div className="flex-1">
                   <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 w-[85%] rounded-full"></div>
                   </div>
                 </div>
                 <span className="text-xs font-bold">85%</span>
              </div>
              <div className="w-full bg-white rounded-full p-2 border border-slate-200 shadow-sm flex items-center justify-between pl-4">
                <span className="text-sm font-medium text-slate-400">Search metric...</span>
                <button className="bg-rose-500 text-white p-2 rounded-full"><ArrowRight size={16} /></button>
              </div>
            </div>

            {/* Floating Left Cards */}
            <div className="absolute left-[5%] top-[25%] md:left-[10%] md:top-[30%] w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 z-10 -rotate-3 hover:rotate-0 transition-transform cursor-default">
              <div className="flex justify-between items-center mb-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center"><BarChart3 size={16} className="text-indigo-600"/></div>
                <span className="text-emerald-500 text-xs font-bold">+12%</span>
              </div>
              <div className="text-2xl font-bold">98%</div>
              <div className="text-xs text-slate-400">Survival Rate</div>
            </div>

            <div className="absolute left-[10%] bottom-[20%] md:left-[15%] md:bottom-[25%] w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 z-30 rotate-2 hover:rotate-0 transition-transform cursor-default">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm flex items-center justify-center text-white"><Wheat size={20}/></div>
                <div>
                  <div className="text-sm font-bold">Total Feed</div>
                  <div className="text-xs text-slate-400">This Month</div>
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">2,503 kg</div>
            </div>

            {/* Floating Right Cards */}
            <div className="absolute right-[5%] top-[20%] md:right-[15%] md:top-[25%] w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 z-10 rotate-3 hover:rotate-0 transition-transform cursor-default">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Production Met</div>
              <div className="flex items-end gap-2 mb-2">
                <div className="text-3xl font-bold">89%</div>
                <div className="text-xs text-emerald-500 font-bold mb-1 flex items-center"><TrendingUp size={12} className="mr-1"/> Up</div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[89%] rounded-full"></div>
              </div>
            </div>

            <div className="absolute right-[10%] bottom-[15%] md:right-[10%] md:bottom-[20%] w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 z-30 -rotate-2 hover:rotate-0 transition-transform cursor-default">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-bold text-slate-500">Security</span>
                 <Shield size={14} className="text-rose-400" />
              </div>
              <div className="space-y-3">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[100%]"></div></div>
                <div className="h-2 w-3/4 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-400 w-[100%]"></div></div>
                <div className="h-2 w-1/2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-[100%]"></div></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Trusted Partners */}
      <section className="py-10 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Trusted by top agricultural partners</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <span className="text-xl font-bold tracking-tighter">AgriTech</span>
             <span className="text-xl font-bold tracking-tighter">FarmBase</span>
             <span className="text-xl font-bold tracking-tighter">PoultryNet</span>
             <span className="text-xl font-bold tracking-tighter">YieldPro</span>
             <span className="text-xl font-bold tracking-tighter">EcoFarm</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-md">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                Why farm managers love our AI-Powered dashboard
              </h2>
              <button className="bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
                Learn more
              </button>
            </div>
            
            {/* Bento Box Layout */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Analytics</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Instantly track egg production metrics, mortality rates, and feed conversion as they happen.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="text-rose-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Predictions</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Leverage machine learning to predict disease outbreaks and identify low-yield batches before they cost you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-16">What farm owners are saying</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative group hover:shadow-xl transition-shadow duration-300">
                <div className="flex text-amber-400 mb-6">
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                  "Since implementing PFMS, our farm's productivity has skyrocketed. The AI insights alone have helped us reduce feed waste by 30% faster than last quarter. Absolutely essential tool."
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item === 1 ? 'from-indigo-400 to-purple-500' : item === 2 ? 'from-rose-400 to-orange-400' : 'from-emerald-400 to-teal-500'}`} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Alex Thompson</div>
                    <div className="text-xs text-slate-500">Farm Manager, Green Acres</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive FAQs Section */}
      <FAQSection />

      {/* Footer CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-50 via-rose-50/30 to-white -z-10" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">
            Supercharge your farm<br/>with AI today!
          </h2>
          {isLoggedIn ? (
            <Link href="/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full text-base font-semibold transition-all shadow-xl shadow-indigo-600/25 active:scale-95">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/signup" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full text-base font-semibold transition-all shadow-xl shadow-indigo-600/25 active:scale-95">
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      {/* Simple Footer */}
      <LandingFooter />

    </div>
  );
}
