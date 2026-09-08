'use strict';
'use client';

import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FeatureGuardProps {
  isEnabled: boolean;
  featureName: string;
  description?: string;
  children: React.ReactNode;
  userRole?: string;
}

export function FeatureGuard({
  isEnabled,
  featureName,
  description = 'This module is restricted by the Super Admin feature controls or requires a subscription tier upgrade.',
  children,
  userRole = 'Admin'
}: FeatureGuardProps) {
  const router = useRouter();

  if (isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16 font-sans">
      <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock size={32} />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full">
            FEATURE DISABLED BY SUPER ADMIN / UPGRADE REQUIRED
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 pt-1">{featureName}</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="pt-2 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/dashboard/settings?tab=subscription')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Upgrade Account Plan</span>
            <ArrowRight size={15} />
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer border border-slate-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
