'use strict';
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Palette, Sparkles, Building2, CheckCircle2, Globe, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useWhiteLabel } from '../WhiteLabelContext';

interface WhiteLabelClientProps {
  tier: string;
  cooperative?: any;
}

export function WhiteLabelClient({ tier, cooperative }: WhiteLabelClientProps) {
  const router = useRouter();
  const whiteLabel = useWhiteLabel();

  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const [coopName, setCoopName] = useState(cooperative?.coopName || whiteLabel.coopName || 'My Enterprise Poultry Farm');
  const [subdomain, setSubdomain] = useState(cooperative?.subdomain || whiteLabel.subdomain || 'maitama-farm');
  const [logoUrl, setLogoUrl] = useState(cooperative?.logoUrl || whiteLabel.logoUrl || '');
  const [brandColor, setBrandColor] = useState<'indigo' | 'emerald' | 'purple' | 'amber' | 'slate'>(
    (cooperative?.brandColor || whiteLabel.brandColor || 'indigo') as any
  );
  const [customReportHeader, setCustomReportHeader] = useState(
    cooperative?.customReportHeader || whiteLabel.customReportHeader || 'Official Farm Management Analytics Report'
  );
  const [customInvoiceFooter, setCustomInvoiceFooter] = useState(
    cooperative?.customInvoiceFooter || whiteLabel.customInvoiceFooter || 'Thank you for buying from our certified organic poultry farm!'
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveWhiteLabel = async () => {
    setIsSaving(true);
    try {
      await whiteLabel.updateWhiteLabel({
        coopName,
        subdomain,
        logoUrl,
        brandColor,
        customReportHeader,
        customInvoiceFooter
      });
      toast.success('White-Label Branding & Theme Saved Globally!');
      router.refresh();
    } catch (_e) {
      toast.error('Failed to save white-label branding');
    } finally {
      setIsSaving(false);
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
            <h2 className="text-2xl font-extrabold text-slate-900 pt-1">White-Label Portal & Custom Branding</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Custom logo URLs, custom subdomains, branded PDF report headers, custom invoice footers, and app theme customization are exclusively available on Enterprise Plus.
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
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap bg-purple-600 text-white shadow-md"
        >
          <Palette size={16} /> White-Label & Themes
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/api')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Sparkles size={16} /> API Keys & Webhooks
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

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> Enterprise Suite
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              GLOBAL WHITE-LABELING
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">White-Label Portal & Branding</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Customize your farm title, custom subdomain, brand logo, report headers, and invoice footer notes across the whole app.
          </p>
        </div>
      </div>

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
                  {(['indigo', 'emerald', 'purple', 'amber', 'slate'] as const).map((c) => (
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
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles size={16} /> {isSaving ? 'Saving Settings...' : 'Save White-Label & Theme Settings'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
