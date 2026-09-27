'use strict';
'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

interface AccessDeniedProps {
  role?: string;
  path?: string;
}

export function AccessDenied({ role = 'Staff', path = '' }: AccessDeniedProps) {
  // Extract a readable module name from path
  const readableModule = path
    ? path.replace('/dashboard/', '').replace('/', ' ').toUpperCase()
    : 'THIS MODULE';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200/80 shadow-xl p-8 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mb-6 shadow-sm">
          <ShieldAlert size={32} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-3">
          <Lock size={12} />
          <span>Access Restricted</span>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Permission Required
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Your current role (<strong className="text-slate-800 font-semibold">{role}</strong>) does not have authorization to view{' '}
          <strong className="text-slate-800 font-semibold">{readableModule}</strong>. Please contact your organization administrator if you need access.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Home size={16} />
            <span>Return to Dashboard</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
