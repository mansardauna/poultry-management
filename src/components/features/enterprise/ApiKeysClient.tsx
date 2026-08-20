'use strict';
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Key, Plus, Copy, Trash2, Sparkles, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ApiKeysClientProps {
  tier: string;
  apiKeys?: any[];
}

export function ApiKeysClient({ tier, apiKeys: initialApiKeys = [] }: ApiKeysClientProps) {
  const router = useRouter();
  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const [apiKeys, setApiKeys] = useState<any[]>(initialApiKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyWebhook, setNewKeyWebhook] = useState('');
  const [keyScope, setKeyScope] = useState('read:analytics,write:sales');

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key description');
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

  if (!isEnterprise) {
    return (
      <div className="space-y-6 max-w-4xl pb-16 font-sans">
        <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center space-y-5 shadow-sm">
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full">
              ENTERPRISE TIER REQUIRED
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 pt-1">Enterprise REST API & Webhooks</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Custom REST API Keys, OAuth scopes, and automated ERP webhook triggers (QuickBooks, SAP, Sage) are exclusively available on Enterprise Plus.
            </p>
          </div>

          <div className="pt-2 max-w-md mx-auto">
            <button
              onClick={() => router.push('/dashboard/settings?tab=subscription')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl shadow transition-all cursor-pointer"
            >
              ⚡ Upgrade to Enterprise & Cooperative (₦45,000/mo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Top Enterprise Sub-Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => router.push('/dashboard/enterprise/branches')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Building2 size={16} /> Branch Matrix
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/whitelabel')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Sparkles size={16} /> White-Label & Themes
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/api')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap bg-indigo-600 text-white shadow-md"
        >
          <Key size={16} /> API Keys & Webhooks ({apiKeys.length})
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/vet')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Sparkles size={16} /> 24/7 Vet Hotline
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/feed-pool')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Sparkles size={16} /> Wholesale Feed Pool
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> Enterprise Suite
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              API KEYS & WEBHOOKS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">API Keys & Webhooks Gateway</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Connect internal ERP systems, custom mobile applications, or accounting software via secure production API endpoints.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key size={20} className="text-indigo-600" /> Enterprise REST API Keys & Webhooks Gateway
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input 
              type="text"
              placeholder="Key Description (e.g. QuickBooks Sync)"
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
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase font-mono">
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
  );
}
