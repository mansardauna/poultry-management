'use strict';

import Link from 'next/link';

import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pt-20">
      {/* Top Navbar */}
      <LandingNav activePath="/privacy" />

      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mb-8">Last Updated: August 2026</p>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Overview</h2>
            <p>
              Poultry Management System ("PFMS", "we", "our") values your privacy and is committed to protecting your personal and farm telemetry data. This Privacy Policy outlines how we collect, store, process, and safeguard information when you use our SaaS application, telemetry services, and web platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Account Credentials:</strong> Full name, email address, role, and organization details provided during registration.</li>
              <li><strong>Operational Farm Data:</strong> Egg collection logs, bird flock counts, feed consumption levels, health logs, and financial invoice details.</li>
              <li><strong>Billing & Payment Information:</strong> Payment references processed securely via Paystack and Stripe. We do not store raw credit card numbers.</li>
              <li><strong>Technical Telemetry:</strong> IP addresses, browser types, and CCTV video stream metadata for authorized CCTV surveillance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Multi-Tenant Data Isolation</h2>
            <p>
              Your farm records are strictly isolated using enterprise database row-level security (RLS) and organization scoping (`workspaceId`). No other farm user or external organization can view or query your operational records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Data Sharing & Third Parties</h2>
            <p>
              We do not sell, rent, or trade your personal or farm operational data to third parties. We share information only with trusted infrastructure providers required to operate our service (e.g. Supabase, Stripe, Paystack).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Contact Us</h2>
            <p>
              If you have any questions regarding this Privacy Policy, please contact our Data Protection Officer at <a href="mailto:privacy@poultryfarm.com" className="text-indigo-600 font-semibold underline">privacy@poultryfarm.com</a>.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
