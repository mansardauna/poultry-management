'use strict';
'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

export default function ContactPage() {
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
            <Link href="/contact" className="text-indigo-600 font-semibold">Contact</Link>
            <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

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
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Poultry Management System. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
