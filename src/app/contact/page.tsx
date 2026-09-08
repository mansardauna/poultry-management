'use strict';
'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pt-20">
      {/* Top Navbar */}
      <LandingNav activePath="/contact" />

      {/* Main Content */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Get In Touch
          </span>
          <h1 className="text-4xl font-bold text-slate-900 mt-4 tracking-tight">
            We are here to support your farm operations
          </h1>
          <p className="text-slate-600 mt-3">
            Have questions about subscriptions, custom enterprise white-label portals, or technical support? Our team is available 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Details Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Email Us</h3>
                <p className="text-xs text-slate-500 mt-1">support@poultryfarm.com</p>
                <p className="text-xs text-slate-500">sales@poultryfarm.com</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Phone size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Priority Hotline</h3>
                <p className="text-xs text-slate-500 mt-1">+234 800-POULTRY-VET</p>
                <p className="text-xs text-slate-500">+234 801-234-5678</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Headquarters</h3>
                <p className="text-xs text-slate-500 mt-1">12 Innovation Hub Way, Victoria Island</p>
                <p className="text-xs text-slate-500">Lagos State, Nigeria</p>
              </div>
            </div>
          </div>

          {/* Interactive Contact Form */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Send us a message</h2>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Thank you! Your message has been sent to our support team.'); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" required placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" required placeholder="john@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Subject</label>
                <input type="text" required placeholder="Enterprise Portal Inquiry" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Message</label>
                <textarea rows={5} required placeholder="Tell us how we can help your farm operation..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>

              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors flex items-center gap-2">
                <Send size={16} /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
