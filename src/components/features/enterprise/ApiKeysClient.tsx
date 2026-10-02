'use strict';
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Sparkles, 
  Building2, 
  Bot, 
  Code2, 
  Check, 
  Cpu, 
  Terminal, 
  FileJson,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface ApiKeysClientProps {
  tier: string;
  apiKeys?: any[];
}

export function ApiKeysClient({ tier, apiKeys: initialApiKeys = [] }: ApiKeysClientProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const [apiKeys, setApiKeys] = useState<any[]>(initialApiKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyWebhook, setNewKeyWebhook] = useState('');
  const [keyScope, setKeyScope] = useState('read:analytics,write:sales,ai:parse');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'js'>('curl');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const activeKeySample = apiKeys.length > 0 ? apiKeys[0].secretKey : 'pfms_live_sk_example_key_77a9b';

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
    if (!await confirm('Revoke this Enterprise API Key?')) return;
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    setCopiedEndpoint(label);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  if (!isEnterprise) {
    return (
      <div className="space-y-6 max-w-4xl pb-16 font-sans">
        <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center space-y-5 shadow-sm">
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[10px] px-3 py-1 rounded-full">
              ENTERPRISE TIER REQUIRED
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 pt-1">Enterprise REST API & AI Developer Suite</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Production REST API Keys, OAuth scopes, AI machine-to-machine endpoints, and automated ERP webhook triggers (QuickBooks, SAP, Sage) are exclusively available on Enterprise Plus.
            </p>
          </div>

          <div className="pt-2 max-w-md mx-auto">
            <button
              onClick={() => router.push('/dashboard/settings?tab=subscription')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl shadow transition-all cursor-pointer"
            >
              Upgrade to Enterprise & Cooperative
            </button>
          </div>
        </div>
      </div>
    );
  }

  const curlExample = `curl -X POST https://your-domain.com/api/ai-parse \\
  -H "Authorization: Bearer ${activeKeySample}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Collected 45 crates with 12 cracked, fed 4 bags of layer mash, 3 birds died, and sold 20 crates for 90000"
  }'`;

  const pythonExample = `import requests

url = "https://your-domain.com/api/ai-parse"
headers = {
    "Authorization": f"Bearer ${activeKeySample}",
    "Content-Type": "application/json"
}
payload = {
    "text": "Collected 45 crates with 12 cracked, fed 4 bags of layer mash, 3 birds died, and sold 20 crates for 90000"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const jsExample = `const res = await fetch('https://your-domain.com/api/ai-parse', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${activeKeySample}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Collected 45 crates with 12 cracked, fed 4 bags of layer mash, 3 birds died, and sold 20 crates for 90000'
  })
});
const data = await res.json();
console.log(data);`;

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Top Enterprise Sub-Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1 text-xs font-bold tracking-wider">
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
          <Key size={16} /> API Keys & AI Endpoints ({apiKeys.length})
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Key size={24} className="text-indigo-600 shrink-0" />
            Developer Hub & API Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage production secret keys, automate data pipelines with webhooks, and integrate machine-to-machine AI poultry endpoints.
          </p>
        </div>
      </div>

      {/* CARD 1: REST API KEYS */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key size={18} className="text-indigo-600" /> Production REST API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input 
              type="text"
              placeholder="Key Description (e.g. QuickBooks Sync, Farm IoT)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="p-3 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-indigo-500"
            />

            <input 
              type="text"
              placeholder="Webhook Endpoint URL (Optional)"
              value={newKeyWebhook}
              onChange={(e) => setNewKeyWebhook(e.target.value)}
              className="p-3 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-indigo-500"
            />

            <button
              onClick={handleCreateApiKey}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus size={16} /> Generate Production API Key
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 tracking-wider">Active API Keys ({apiKeys.length})</h4>
            {apiKeys.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                No active Enterprise API Keys. Create a new key above to integrate ERP, accounting software, or AI workers.
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
                      onClick={() => copyToClipboard(k.secretKey, 'API Secret Key')}
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

      {/* CARD 2: AI API GATEWAY & ENDPOINTS */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bot size={20} className="text-purple-600" /> AI Farm Intelligence & Multi-Modal Endpoints
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Direct machine-to-machine AI endpoints for voice transcription, natural language telemetry, and health diagnostics.
              </p>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1">
              <Zap size={12} /> Gemini Flash 2.0 Powered
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Endpoints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-purple-600 text-white font-mono text-[9px] font-extrabold px-2 py-0.5 rounded">POST</span>
                <span className="text-[10px] text-purple-700 font-bold">NLP / Voice</span>
              </div>
              <p className="font-mono text-xs font-bold text-slate-900">/api/ai-parse</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Extracts cracked/good eggs, feed in kg, mortality, expenses, and sales from audio or text logs.
              </p>
              <button
                onClick={() => copyToClipboard('/api/ai-parse', 'Endpoint')}
                className="text-[11px] text-purple-700 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
              >
                <Copy size={11} /> Copy Route
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-indigo-600 text-white font-mono text-[9px] font-extrabold px-2 py-0.5 rounded">POST</span>
                <span className="text-[10px] text-indigo-700 font-bold">Health AI</span>
              </div>
              <p className="font-mono text-xs font-bold text-slate-900">/api/health</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Classifies flock health records, symptoms, and diagnoses medication or quarantine protocols.
              </p>
              <button
                onClick={() => copyToClipboard('/api/health', 'Endpoint')}
                className="text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
              >
                <Copy size={11} /> Copy Route
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-600 text-white font-mono text-[9px] font-extrabold px-2 py-0.5 rounded">GET</span>
                <span className="text-[10px] text-emerald-700 font-bold">Yield Curve</span>
              </div>
              <p className="font-mono text-xs font-bold text-slate-900">/api/batches</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Fetches active batch curves, age, mortality rates, and AI production telemetry.
              </p>
              <button
                onClick={() => copyToClipboard('/api/batches', 'Endpoint')}
                className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
              >
                <Copy size={11} /> Copy Route
              </button>
            </div>
          </div>

          {/* Interactive Code Samples */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Code2 size={16} className="text-purple-600" /> Machine-to-Machine Integration Snippet
              </h4>

              {/* Code Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeCodeTab === 'curl' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeCodeTab === 'python' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveCodeTab('js')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeCodeTab === 'js' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Node.js
                </button>
              </div>
            </div>

            <div className="relative bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
              <button
                onClick={() => {
                  const code = activeCodeTab === 'curl' ? curlExample : activeCodeTab === 'python' ? pythonExample : jsExample;
                  copyToClipboard(code, 'Code snippet');
                }}
                className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                <Copy size={12} /> Copy Code
              </button>

              <pre className="pr-20">
                <code>
                  {activeCodeTab === 'curl' && curlExample}
                  {activeCodeTab === 'python' && pythonExample}
                  {activeCodeTab === 'js' && jsExample}
                </code>
              </pre>
            </div>
          </div>

          {/* Sample JSON Response */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <FileJson size={16} className="text-emerald-600" /> Sample AI Structured JSON Output
            </h4>
            <div className="bg-slate-900 text-emerald-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800">
              <pre>
{`{
  "success": true,
  "parsed": {
    "eggs": [{ "goodEggs": 1338, "crackedEggs": 12, "notes": "AI Auto-Logged" }],
    "feedUsedKg": 100,
    "mortalityCount": 3,
    "sales": [{ "type": "Eggs", "quantity": 20, "totalAmount": 90000 }],
    "expenses": []
  }
}`}
              </pre>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
