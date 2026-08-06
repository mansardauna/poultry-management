'use strict';

import Link from 'next/link';
import { ArrowLeft, Shield, Cpu, Users, Building2, CheckCircle2, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600">
            <span>🐓 Poultry Management System</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link href="/about" className="text-indigo-600 font-semibold">About</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
            <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            About Our Platform
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mt-4 tracking-tight leading-tight">
            Empowering poultry farmers with modern AI telemetry and cooperative intelligence
          </h1>
          <p className="text-lg text-slate-600 mt-6 max-w-3xl mx-auto leading-relaxed font-normal">
            Poultry Management System (PFMS) is a next-generation SaaS enterprise platform designed to streamline multi-farm management, automate daily egg collection logs, monitor CCTV feeds, and digitize cooperative supply chains.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">AI-Powered Telemetry</h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Real-time voice auto-logging, mortality drop detection, and egg cushioning audit intelligence that eliminate operational blind spots.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
              <Building2 size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Multi-Farm Scalability</h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Designed from the ground up to support single commercial farms, regional branch networks, and enterprise cooperatives across locations.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Enterprise Security</h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Bank-grade multi-tenant data isolation, role-based staff access control, and real-time Paystack & Stripe financial transaction reconciliation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Poultry Management System. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
