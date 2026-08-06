'use strict';
'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldAlert, Save, RefreshCw, Layers, CheckCircle, Video, Sparkles, FileSpreadsheet, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface SaasPlanConfig {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  maxBranches: number;
  cctvEnabled: boolean;
  aiLoggerEnabled: boolean;
  exportReportsEnabled: boolean;
  enterpriseHubEnabled: boolean;
  features: string[];
}

export function AdminCmsClient({ initialPlans, currentUserEmail }: { initialPlans: SaasPlanConfig[]; currentUserEmail: string }) {
  const isSuperAdmin = currentUserEmail === 'owner@poultry.com';
  const [plans, setPlans] = useState<SaasPlanConfig[]>(initialPlans);
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (planId: string, field: keyof SaasPlanConfig, value: any) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const handleSaveAll = async () => {
    if (!isSuperAdmin) {
      toast.error('Access Denied: Only owner@poultry.com is authorized as Super Admin');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'SaaS plans updated successfully!');
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      toast.error('Error saving plans configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-4">
          <ShieldAlert size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-red-900">Access Restricted</h2>
          <p className="text-sm text-red-700 max-w-md mx-auto">
            Super Admin CMS control panel is strictly restricted to <strong>owner@poultry.com</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Super Admin Portal (owner@poultry.com)
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">SaaS Subscription CMS & Feature Configurator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Modify plan pricing, branch limits, and toggle feature access live across the platform without touching code.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Plans Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className="border-slate-200 shadow-sm relative overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 p-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Plan ID: {plan.id}</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Live Sync</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 mt-1">
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => handleFieldChange(plan.id, 'name', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-base font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Monthly Price (₦)</label>
                <input
                  type="number"
                  value={plan.priceMonthly}
                  onChange={(e) => handleFieldChange(plan.id, 'priceMonthly', Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Annual Price (₦)</label>
                <input
                  type="number"
                  value={plan.priceAnnual}
                  onChange={(e) => handleFieldChange(plan.id, 'priceAnnual', Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Max Branches Limit</label>
                <input
                  type="number"
                  value={plan.maxBranches}
                  onChange={(e) => handleFieldChange(plan.id, 'maxBranches', Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                />
              </div>

              {/* Dynamic Feature Toggles */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Feature Entitlements</h4>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">CCTV Live Feed</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={plan.cctvEnabled}
                    onChange={(e) => handleFieldChange(plan.id, 'cctvEnabled', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">AI Voice Logger</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={plan.aiLoggerEnabled}
                    onChange={(e) => handleFieldChange(plan.id, 'aiLoggerEnabled', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">PDF/CSV Export Reports</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={plan.exportReportsEnabled}
                    onChange={(e) => handleFieldChange(plan.id, 'exportReportsEnabled', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">Enterprise & Coop Hub</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={plan.enterpriseHubEnabled}
                    onChange={(e) => handleFieldChange(plan.id, 'enterpriseHubEnabled', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
