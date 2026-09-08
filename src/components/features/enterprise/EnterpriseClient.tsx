'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Building2, 
  Globe, 
  Shield, 
  PhoneCall, 
  Key, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  Upload, 
  Palette, 
  FileText, 
  Wheat, 
  TrendingUp, 
  RefreshCw, 
  ExternalLink,
  Zap,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspace } from '../WorkspaceContext';

interface EnterpriseClientProps {
  tier: string;
  workspaces: any[];
  branchMetrics?: Record<string, { totalBirds: number; totalEggs: number; feedStockKg: number; revenue: number }>;
  cooperative?: any;
  apiKeys?: any[];
  consultants?: any[];
  bulkOrders?: any[];
}

export function EnterpriseClient({ 
  tier, 
  workspaces, 
  branchMetrics = {}, 
  cooperative, 
  apiKeys: initialApiKeys = [], 
  consultants: initialConsultants = [], 
  bulkOrders: initialBulkOrders = [] 
}: EnterpriseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'matrix';

  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const { setActiveWorkspace, activeWorkspace } = useWorkspace();

  // Active Sub-Tab State
  const [activeTab, setActiveTab] = useState<'matrix' | 'whitelabel' | 'apikeys' | 'vet' | 'bulk'>(
    (activeTabParam as any) || 'matrix'
  );

  // White-label & Theme Customization State
  const [coopName, setCoopName] = useState(cooperative?.coopName || 'My Enterprise Poultry Farm');
  const [subdomain, setSubdomain] = useState(cooperative?.subdomain || 'maitama-farm');
  const [logoUrl, setLogoUrl] = useState(cooperative?.logoUrl || '');
  const [brandColor, setBrandColor] = useState(cooperative?.brandColor || 'indigo');
  const [customReportHeader, setCustomReportHeader] = useState(cooperative?.customReportHeader || 'Official Enterprise Farm Analytics Report');
  const [customInvoiceFooter, setCustomInvoiceFooter] = useState(cooperative?.customInvoiceFooter || 'Thank you for buying from our certified organic poultry farm!');
  const [themeMode, setThemeMode] = useState(cooperative?.themeMode || 'modern');
  const [isSavingCoop, setIsSavingCoop] = useState(false);

  // API Keys & Webhooks State
  const [apiKeys, setApiKeys] = useState<any[]>(initialApiKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyWebhook, setNewKeyWebhook] = useState('');
  const [keyScope, setKeyScope] = useState('read:analytics,write:sales');

  // Vet Tickets State
  const [consultants, setConsultants] = useState<any[]>(initialConsultants);
  const [openVetModal, setOpenVetModal] = useState(false);
  const [ticketType, setTicketType] = useState('Emergency Outbreak');
  const [ticketNotes, setTicketNotes] = useState('');
  const [ticketPhone, setTicketPhone] = useState('+234 800-POULTRY-VET');

  // Bulk Feed Order State
  const [bulkOrders, setBulkOrders] = useState<any[]>(initialBulkOrders);
  const [bulkFeedType, setBulkFeedType] = useState('Layer Mash (Bulk 50kg)');
  const [bulkBags, setBulkBags] = useState('100');

  useEffect(() => {
    // Load local white-label preferences if saved
    try {
      const savedPref = localStorage.getItem('pfms_white_label');
      if (savedPref) {
        const parsed = JSON.parse(savedPref);
        if (parsed.coopName) setCoopName(parsed.coopName);
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        if (parsed.brandColor) setBrandColor(parsed.brandColor);
      }
    } catch (_e) {}
  }, []);

  // Handler: Save White-Label Branding
  const handleSaveWhiteLabel = async () => {
    setIsSavingCoop(true);
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_cooperative',
          coopName,
          subdomain,
          logoUrl,
          brandColor,
          customReportHeader,
          customInvoiceFooter,
          themeMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('White-Label Branding & Theme Saved!');
        // Save to local storage for instant live theme reflection
        localStorage.setItem('pfms_white_label', JSON.stringify({ coopName, logoUrl, brandColor, customReportHeader, customInvoiceFooter }));
        router.refresh();
      } else {
        toast.error('Failed to save white-label branding');
      }
    } catch (_e) {
      toast.error('Error saving enterprise settings');
    } finally {
      setIsSavingCoop(false);
    }
  };

  // Handler: Create API Key
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_api_key',
          name: newKeyName,
          webhookUrl: newKeyWebhook,
          scope: keyScope
        })
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setApiKeys(prev => [data.apiKey, ...prev]);
        setNewKeyName('');
        setNewKeyWebhook('');
        toast.success(`Generated Enterprise API Key: ${data.apiKey.name}`);
      } else {
        toast.error(data.error || 'Failed to create API key');
      }
    } catch (_e) {
      toast.error('Error creating API key');
    }
  };

  // Handler: Revoke API Key
  const handleRevokeKey = async (id: string) => {
    if (!confirm('Revoke this Enterprise API Key?')) return;
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_api_key', id })
      });
      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.id !== id));
        toast.success('API Key revoked');
      }
    } catch (_e) {
      toast.error('Failed to revoke API key');
    }
  };

  // Handler: Create Emergency Vet Ticket
  const handleCreateVetTicket = async () => {
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_vet_ticket',
          ticketType,
          notes: ticketNotes,
          contactPhone: ticketPhone
        })
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setConsultants(prev => [data.ticket, ...prev]);
        setOpenVetModal(false);
        setTicketNotes('');
        toast.success('Emergency Vet Ticket Dispatched to Lead Veterinarian!');
      }
    } catch (_e) {
      toast.error('Failed to dispatch ticket');
    }
  };

  // Handler: Create Bulk Feed Order
  const handleCreateBulkOrder = async () => {
    const bags = Number(bulkBags) || 100;
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_bulk_order',
          feedType: bulkFeedType,
          quantityBags: bags,
          discountPrice: 12500
        })
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setBulkOrders(prev => [data.order, ...prev]);
        toast.success(`Bulk Feed Procurement Order created for ${bags} bags!`);
      }
    } catch (_e) {
      toast.error('Failed to submit bulk order');
    }
  };

  if (!isEnterprise) {
    return (
      <div className="space-y-6 max-w-4xl pb-16 font-sans">
        <div className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="w-20 h-20 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto border border-purple-500/30 animate-pulse">
            <Building2 size={40} />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow">
              ENTERPRISE TIER REQUIRED
            </span>
            <h2 className="text-3xl font-extrabold text-white">Enterprise Suite & White-Label Portal</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Multi-farm matrix telemetry, white-label cooperative custom branding, 24/7 priority veterinarian hotline, custom REST API keys, and wholesale bulk feed pools are exclusively available on Enterprise Plus.
            </p>
          </div>

          <div className="pt-4 max-w-md mx-auto">
            <button
              onClick={() => router.push('/dashboard/settings?tab=subscription')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-4 rounded-2xl shadow-xl transition-all cursor-pointer"
            >
              ⚡ Upgrade to Enterprise & Cooperative (₦45,000/mo)
            </button>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-indigo-400 flex-shrink-0" />
              <span>Multi-Farm Central Matrix</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-purple-400 flex-shrink-0" />
              <span>White-Label Custom Portal</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span>24/7 Priority Vet Hotline</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate live database totals
  const totalBirdsAll = Object.values(branchMetrics).reduce((acc, curr) => acc + curr.totalBirds, 0);
  const totalEggsAll = Object.values(branchMetrics).reduce((acc, curr) => acc + curr.totalEggs, 0);
  const totalRevenueAll = Object.values(branchMetrics).reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> Enterprise Suite
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              ACTIVE UNLIMITED TIER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{coopName}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Multi-farm matrix management, white-label custom themes, 24/7 veterinarian tickets, and API logistics.
          </p>
        </div>

        {/* Aggregated Real Matrix Stat Chips */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto text-xs font-mono">
          <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">TOTAL BIRDS</span>
            <span className="text-lg font-bold text-emerald-400">{totalBirdsAll.toLocaleString()}</span>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">TOTAL EGGS</span>
            <span className="text-lg font-bold text-indigo-300">{totalEggsAll.toLocaleString()}</span>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">NET REVENUE</span>
            <span className="text-lg font-bold text-amber-400">₦{totalRevenueAll.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={16} /> Branch Matrix ({workspaces.length})
        </button>

        <button
          onClick={() => setActiveTab('whitelabel')}
          className={`px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'whitelabel' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette size={16} /> White-Label & Themes
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'apikeys' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key size={16} /> API Keys & Webhooks ({apiKeys.length})
        </button>

        <button
          onClick={() => setActiveTab('vet')}
          className={`px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vet' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall size={16} /> 24/7 Vet Hotline ({consultants.length})
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bulk' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wheat size={16} /> Wholesale Bulk Pool ({bulkOrders.length})
        </button>
      </div>

      {/* TAB 1: Branch Matrix & Live Aggregated Telemetry */}
      {activeTab === 'matrix' && (
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={20} className="text-indigo-600" /> Multi-Farm Branch Matrix
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Real live telemetry aggregated from database records across all farm branches</p>
            </div>
            <button 
              onClick={() => {
                toast.success('Redirecting to add new branch...');
                router.push('/dashboard/settings?tab=subscription');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Add Regional Branch
            </button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workspaces.map((ws, i) => {
                const bm = branchMetrics[ws.id] || { totalBirds: 0, totalEggs: 0, feedStockKg: 0, revenue: 0 };
                const isActive = activeWorkspace?.id === ws.id;

                return (
                  <div 
                    key={ws.id || i} 
                    className={`border p-5 rounded-2xl space-y-4 relative transition-all ${
                      isActive ? 'border-2 border-indigo-600 bg-indigo-50/40 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isActive ? 'ACTIVE WORKSPACE' : `Location #${i + 1}`}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
                        ● LIVE TELEMETRY
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{ws.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{ws.type || 'Commercial Farm Branch'}</p>
                    </div>

                    {/* Real Database Telemetry Stats */}
                    <div className="pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700 font-mono">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block font-sans uppercase">FLOCK SIZE</span>
                        <span className="text-sm font-bold text-slate-900">{bm.totalBirds.toLocaleString()} Birds</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block font-sans uppercase">EGG PRODUCTION</span>
                        <span className="text-sm font-bold text-emerald-600">{Math.floor(bm.totalEggs / 30).toLocaleString()} Crates</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block font-sans uppercase">FEED STOCK</span>
                        <span className="text-sm font-bold text-indigo-600">{bm.feedStockKg.toLocaleString()} Kg</span>
                      </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block font-sans uppercase">REVENUE</span>
                        <span className="text-sm font-bold text-amber-600">₦{bm.revenue.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setActiveWorkspace(ws);
                          toast.success(`Switched active workspace to "${ws.name}"`);
                        }}
                        className={`w-full text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isActive ? 'Currently Active' : `Switch to ${ws.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: White-Label Portal & Custom Themes & Report Builder */}
      {activeTab === 'whitelabel' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Palette size={20} className="text-purple-600" /> Cooperative White-Label Portal & Custom Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Cooperative / Enterprise Name *</label>
                    <input 
                      type="text" 
                      value={coopName} 
                      onChange={(e) => setCoopName(e.target.value)} 
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Custom Portal Sub-Domain *</label>
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        value={subdomain} 
                        onChange={(e) => setSubdomain(e.target.value)} 
                        className="w-full p-3 border border-slate-200 rounded-l-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <span className="bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs px-3 py-3 rounded-r-xl font-mono">
                        .poultryfarm.com
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Brand Logo Image URL</label>
                    <input 
                      type="text" 
                      placeholder="https://example.com/logo.png"
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Brand Theme Accent Color</label>
                    <div className="flex items-center gap-3">
                      {['indigo', 'emerald', 'purple', 'amber', 'slate'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBrandColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                            c === 'indigo' ? 'bg-indigo-600' :
                            c === 'emerald' ? 'bg-emerald-600' :
                            c === 'purple' ? 'bg-purple-600' :
                            c === 'amber' ? 'bg-amber-500' : 'bg-slate-900'
                          } ${brandColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-75 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Custom Report Header Title</label>
                    <input 
                      type="text" 
                      value={customReportHeader} 
                      onChange={(e) => setCustomReportHeader(e.target.value)} 
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Custom Invoice Footer Note</label>
                    <input 
                      type="text" 
                      value={customInvoiceFooter} 
                      onChange={(e) => setCustomInvoiceFooter(e.target.value)} 
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                {/* Live Real-time Preview Box */}
                <div className="bg-slate-950 text-white p-6 rounded-2xl flex flex-col justify-between space-y-4 border border-slate-800 relative shadow-xl">
                  <div>
                    <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block mb-2 font-mono">
                      LIVE PORTAL PREVIEW
                    </span>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                              {coopName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-bold text-white">{coopName}</h3>
                            <p className="text-[10px] text-slate-400 font-mono">https://{subdomain}.poultryfarm.com</p>
                          </div>
                        </div>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                          WHITE-LABEL ACTIVE
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-300 pt-1">
                        <p className="font-bold text-white text-[11px]">{customReportHeader}</p>
                        <p className="text-[10px] text-slate-400 italic">"{customInvoiceFooter}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Branded Invoices & PDF Reports:</span>
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider">
                      Enabled
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={handleSaveWhiteLabel}
                  disabled={isSavingCoop}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles size={16} /> {isSavingCoop ? 'Saving Settings...' : 'Save White-Label & Theme Settings'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Enterprise API Keys & Webhooks Gateway */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key size={20} className="text-indigo-600" /> Enterprise REST API Keys & Webhooks Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Key Generator Form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="text"
                  placeholder="Key Description (e.g. QuickBooks / SAP Sync)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="p-3 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none"
                />

                <input 
                  type="text"
                  placeholder="Webhook Endpoint URL (Optional)"
                  value={newKeyWebhook}
                  onChange={(e) => setNewKeyWebhook(e.target.value)}
                  className="p-3 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none"
                />

                <button
                  onClick={handleCreateApiKey}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={16} /> Generate Production API Key
                </button>
              </div>

              {/* Active API Keys List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">Active API Keys ({apiKeys.length})</h4>
                {apiKeys.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    No active Enterprise API Keys. Create a new key above to integrate ERP or accounting software.
                  </div>
                ) : (
                  apiKeys.map((k) => (
                    <div key={k.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{k.name}</span>
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                            {k.status || 'Active'}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-indigo-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 max-w-md truncate">
                          {k.secretKey}
                        </p>
                        {k.webhookUrl && (
                          <p className="text-[10px] text-slate-400 font-mono">Webhook: {k.webhookUrl}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(k.secretKey);
                            toast.success('API Secret Key copied!');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Copy size={14} /> Copy
                        </button>

                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Revoke Key"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: 24/7 Priority Vet Hotline & Emergency Tickets */}
      {activeTab === 'vet' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-2 border-emerald-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-emerald-50/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PhoneCall size={20} className="text-emerald-600" /> 24/7 Priority Veterinarian Hotline & Tickets
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Direct line to certified poultry disease specialists & emergency farm audits</p>
              </div>

              <button
                onClick={() => setOpenVetModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> Dispatch Emergency Ticket
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Lead Doctor Card */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-black uppercase px-2.5 py-0.5 rounded font-mono">
                    24/7 DEDICATED VET CONSULTANT
                  </span>
                  <h3 className="text-lg font-bold text-white">On-Call Certified Veterinary Specialist</h3>
                  <p className="text-xs text-slate-300 font-mono">+234 800-POULTRY-VET (Direct Emergency Line)</p>
                </div>

                <a 
                  href="https://wa.me/2348000000000?text=Hello%20Doctor,%20I%20need%20urgent%20consultation%20for%20my%20poultry%20farm" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall size={16} /> Call Vet Specialist
                </a>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">Dispatched Vet Tickets ({consultants.length})</h4>
                {consultants.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    No active veterinarian inspection tickets. Click "Dispatch Emergency Ticket" to request a farm visit or audit.
                  </div>
                ) : (
                  consultants.map((t) => (
                    <div key={t.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{t.ticketType}</span>
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                            {t.status || 'Assigned'}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{t.notes}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{t.createdAt?.slice(0, 10)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: Wholesale Feed & Procurement Bulk Pool */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wheat size={20} className="text-amber-600" /> Cooperative Bulk Feed & Wholesale Purchasing Pool
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Order Form */}
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={bulkFeedType}
                  onChange={(e) => setBulkFeedType(e.target.value)}
                  className="p-3 border border-amber-200 rounded-xl text-xs font-semibold bg-white outline-none"
                >
                  <option>Layer Mash (Bulk 50kg)</option>
                  <option>Broiler Finisher (Bulk 50kg)</option>
                  <option>Yellow Maize (Ton Bags)</option>
                  <option>Soybean Meal (Ton Bags)</option>
                </select>

                <input 
                  type="number"
                  placeholder="Quantity (Bags)"
                  value={bulkBags}
                  onChange={(e) => setBulkBags(e.target.value)}
                  className="p-3 border border-amber-200 rounded-xl text-xs font-semibold bg-white outline-none"
                />

                <button
                  onClick={handleCreateBulkOrder}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wheat size={16} /> Join Wholesale Feed Pool
                </button>
              </div>

              {/* Bulk Orders List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">Active Bulk Orders ({bulkOrders.length})</h4>
                {bulkOrders.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    No active wholesale feed pool orders. Pool orders to unlock 15% discount on maize and feeds.
                  </div>
                ) : (
                  bulkOrders.map((o) => (
                    <div key={o.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{o.feedType} ({o.quantityBags} Bags)</span>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Wholesale Discount: 15% Off (₦{(o.discountPrice || 12500).toLocaleString()}/bag)</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2.5 py-1 rounded uppercase">
                        {o.status || 'Processing Pool'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Vet Ticket Modal */}
      {openVetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase">Dispatch Emergency Vet Ticket</h3>
              <button onClick={() => setOpenVetModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issue Category *</label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                >
                  <option>Emergency Outbreak Alert</option>
                  <option>Feed Quality Audit Request</option>
                  <option>Monthly Flock Inspection Audit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Symptoms / Notes *</label>
                <textarea
                  rows={3}
                  placeholder="Describe symptoms or request details..."
                  value={ticketNotes}
                  onChange={(e) => setTicketNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <button
                onClick={handleCreateVetTicket}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl shadow cursor-pointer transition-colors"
              >
                Dispatch Vet Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
