'use strict';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">P</div>
          <span className="font-bold text-slate-800">PFMS</span>
        </Link>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
          <Link href="/about" className="hover:text-indigo-600 transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact Support</Link>
        </div>
        <div className="text-sm text-slate-400">
          © {new Date().getFullYear()} PFMS Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
