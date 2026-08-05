'use strict';
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2, Globe, Shield, PhoneCall, Key, Plus, Sparkles, CheckCircle2, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface EnterpriseClientProps {
  tier: string;
  workspaces: any[];
}

export function EnterpriseClient({ tier, workspaces }: EnterpriseClientProps) {
  const router = useRouter();
  const isEnterprise = tier === 'enterprise';

  // State for White-label branding
  const [coopName, setCoopName] = useState('National Poultry Farmers Cooperative');
  const [subdomain, setSubdomain] = useState('maitama-coop');
  const [accentColor, setAccentColor] = useState('#4f46e5');

  // State for API Keys
  const [apiKey, setApiKey] = useState('pfms_live_key_984920491823');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    toast.success('API Key copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const newK = 'pfms_live_key_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newK);
    toast.success('Generated new Enterprise API Key');
  };

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> Enterprise Hub
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              {isEnterprise ? 'Active Tier' : 'Plan Upgrade Available'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Multi-Farm Enterprise & Cooperative Hub</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Centralized multi-farm management matrix, white-label cooperative portals, 24/7 consultant phone lines, and custom API logistics.
          </p>
        </div>

        {!isEnterprise && (
          <button
            onClick={() => router.push('/dashboard/settings?tab=subscription')}
            className="relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-6 py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            ⚡ Upgrade to Enterprise (₦45,000/mo)
          </button>
        )}
      </div>

      {/* 1. Multi-Farm Enterprise Management Hub */}
      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={20} className="text-indigo-600" /> Multi-Farm Branch Matrix ({workspaces.length} Active Locations)
          </CardTitle>
          <button 
            onClick={() => {
              if (!isEnterprise && workspaces.length >= 1) {
                toast.error('Free tier is limited to 1 branch. Upgrade to Enterprise for multi-farm hubs!');
                router.push('/dashboard/settings?tab=subscription');
                return;
              }
              toast.success('Redirecting to add new branch...');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> Add Regional Farm Branch
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workspaces.map((ws, i) => (
              <div key={ws.id || i} className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl space-y-3 relative hover:border-indigo-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    Location #{i + 1}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    ● Live Telemetry
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{ws.name}</h4>
                  <p className="text-xs text-slate-500">{ws.type || 'Commercial Layer Farm'}</p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">FLOCK SIZE</span>
                    <span>12,450 Birds</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DAILY EGGS</span>
                    <span className="text-emerald-600">380 Crates</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Cooperative White-Label Portal & Custom Branding */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe size={20} className="text-purple-600" /> Cooperative White-Label Portal & Custom Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cooperative / Enterprise Name</label>
                <input 
                  type="text" 
                  value={coopName} 
                  onChange={(e) => setCoopName(e.target.value)} 
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Custom Portal Sub-Domain</label>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={subdomain} 
                    onChange={(e) => setSubdomain(e.target.value)} 
                    className="w-full p-3 border border-slate-200 rounded-l-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs px-3 py-3 rounded-r-xl font-mono">
                    .poultryfarm.com
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider block mb-1">LIVE PORTAL PREVIEW</span>
                <h3 className="text-lg font-bold">{coopName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">https://{subdomain}.poultryfarm.com</p>
              </div>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Branded Customer Invoices & Reports:</span>
                <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded font-bold">Enabled</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={() => toast.success('Cooperative White-Label Settings Saved!')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow cursor-pointer"
            >
              Save White-Label Branding
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. 24/7 Priority Consultant Hotline & Custom API Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hotline */}
        <Card className="border-2 border-emerald-200">
          <CardHeader className="border-b border-slate-100 bg-emerald-50/40">
            <CardTitle className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
              <PhoneCall size={18} className="text-emerald-600" /> 24/7 Priority Agricultural Consultant Hotline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct priority access to certified poultry veterinarians and agricultural consultants for emergency disease outbreaks and flock health audits.
            </p>

            <div className="bg-white border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Dr. Samuel Okafor (Lead Vet Specialist)</p>
                <p className="text-[10px] text-slate-500">+234 800-POULTRY-VET (24/7 Priority Hotline)</p>
              </div>
              <a 
                href="https://wa.me/2348000000000?text=Hello%20Doctor,%20I%20need%20urgent%20consultation%20for%20my%20poultry%20farm" 
                target="_blank" 
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <PhoneCall size={14} /> Call Hotline
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Custom API Keys */}
        <Card className="border-2 border-indigo-200">
          <CardHeader className="border-b border-slate-100 bg-indigo-50/40">
            <CardTitle className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
              <Key size={18} className="text-indigo-600" /> Custom API Access & Warehouse Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your internal ERP, warehouse inventory, or custom mobile apps using secure enterprise REST API endpoints.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Production API Secret Key</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={apiKey} 
                  className="w-full bg-slate-100 font-mono text-xs p-2.5 rounded-xl border border-slate-200 text-slate-800"
                />
                <button 
                  onClick={handleCopyKey}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl transition-colors cursor-pointer"
                  title="Copy Key"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleGenerateNewKey}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Generate New API Key
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
