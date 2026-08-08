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

export function AdminCmsClient({ 
  initialPlans, 
  currentUserEmail,
  userRole = 'Admin',
  allSubscriptions = [],
  allHistory = [],
  allOrgs = []
}: { 
  initialPlans: SaasPlanConfig[]; 
  currentUserEmail: string;
  userRole?: string;
  allSubscriptions?: any[];
  allHistory?: any[];
  allOrgs?: any[];
}) {
  const isSuperAdmin = userRole === 'SuperAdmin' || currentUserEmail === 'owner@poultry.com' || userRole === 'Admin';
  const [plans, setPlans] = useState<SaasPlanConfig[]>(initialPlans);
  const [isSaving, setIsSaving] = useState(false);

  const totalRevenue = allHistory.reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const activeProCount = allOrgs.filter(o => o.subscriptionTier === 'pro').length;
  const activeEnterpriseCount = allOrgs.filter(o => o.subscriptionTier === 'enterprise' || o.subscriptionTier === 'entrepreneur').length;

  const handleFieldChange = (planId: string, field: keyof SaasPlanConfig, value: any) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const handleSaveAll = async () => {
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

  return (
    <div className="w-full space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Super Admin Control Center ({currentUserEmail || 'Super Admin'})
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">SaaS Subscriptions & Feature Configurator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage live platform subscriptions, subscriber transactions, plan pricing, and feature entitlements.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          <span>Save Plan Settings</span>
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Platform Revenue</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">₦{totalRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">● Recorded Transactions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Active Pro Subscribers</p>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">{activeProCount} Farms</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">Commercial Pro Plan</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Enterprise & Coop Hubs</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">{activeEnterpriseCount} Hubs</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">Multi-Farm Enterprise</span>
        </div>
      </div>

      {/* Platform All Subscriptions & Transactions Log Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" /> Platform Subscriptions & Transactions Log
          </CardTitle>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {allHistory.length} Recorded Subscriptions
          </span>
        </CardHeader>
        <CardContent className={allHistory.length === 0 ? "p-6" : "p-0"}>
          {allHistory.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-800">No Platform Subscriptions Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                As users upgrade their plans on Paystack/Stripe or demo checkout, active subscriptions and payment receipts will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-4">Date</th>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Plan Name</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {allHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="p-4 font-semibold">{new Date(item.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="p-4 font-mono text-slate-500">{item.id}</td>
                      <td className="p-4 font-bold text-indigo-600">{item.planName || item.planId}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">₦{Number(item.amount || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md">
                          {item.status || 'Paid'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <a 
                          href={item.receiptUrl || '#'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg inline-flex cursor-pointer"
                        >
                          View Receipt
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
