'use strict';

import Link from 'next/link';

export default function TermsPage() {
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
            <Link href="/about" className="hover:text-indigo-600 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
            <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-xs text-slate-500 mb-8">Last Updated: August 2026</p>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account or accessing the Poultry Management System platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Subscription Plans & Billing</h2>
            <p>
              We offer Free Starter, Commercial Pro, and Enterprise & Cooperative subscription tiers. Subscriptions are billed on a recurring monthly or annual basis. You may cancel your subscription at any time from your settings panel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. User Responsibilities & Data Accuracy</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their login credentials and ensuring the accuracy of farm log inputs, sales invoices, and staff permission assignments.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Service Availability & Uptime SLA</h2>
            <p>
              We strive to maintain a 99.9% uptime SLA for cloud dashboard access and API routes. Planned maintenance will be communicated via in-app alert banners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Poultry Management System. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
