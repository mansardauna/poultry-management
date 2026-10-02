'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Wheat, Sparkles, Building2, Palette, ArrowRightLeft, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/features/LanguageContext';

interface FeedPoolClientProps {
  tier: string;
  bulkOrders?: any[];
}

export function FeedPoolClient({ tier, bulkOrders: initialBulkOrders = [] }: FeedPoolClientProps) {
  const router = useRouter();
  const { t, formatCurrency, formatNumber } = useLanguage();
  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const [bulkOrders, setBulkOrders] = useState<any[]>(initialBulkOrders);
  const [bulkFeedType, setBulkFeedType] = useState('Layer Mash (Bulk 50kg)');
  const [bulkBags, setBulkBags] = useState('100');

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
        toast.success(`${t('Wholesale Feed & Procurement Pool')} - ${bags} ${t('Quantity (Bags)')}`);
      }
    } catch (_e) {
      toast.error(t('Failed to submit bulk order'));
    }
  };

  if (!isEnterprise) {
    return (
      <div className="space-y-6 max-w-4xl pb-16 font-sans">
        <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center space-y-5 shadow-sm">
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[10px] px-3 py-1 rounded-full">
              {t("ENTERPRISE TIER REQUIRED")}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 pt-1">{t("Wholesale Feed & Procurement Pool")}</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t("Pooling feed orders (Maize, Soybean, Layer Mash) with cooperative partner farms to unlock 15% bulk discounts is exclusively available on Enterprise Plus.")}
            </p>
          </div>

          <div className="pt-2 max-w-md mx-auto">
            <button
              onClick={() => router.push('/dashboard/settings?tab=subscription')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl shadow transition-all cursor-pointer"
            >
              {t("Upgrade to Enterprise & Cooperative (₦45,000/mo)")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Top Enterprise Sub-Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1 text-xs font-bold tracking-wider">
        <button
          onClick={() => router.push('/dashboard/enterprise/branches')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Building2 size={16} /> {t("Branch Matrix")}
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/whitelabel')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Palette size={16} /> {t("White-Label & Themes")}
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/api')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <ArrowRightLeft size={16} /> {t("API Keys & Webhooks")}
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/vet')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Award size={16} /> {t("24/7 Vet Hotline")}
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/feed-pool')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap bg-amber-600 text-white shadow-md"
        >
          <Wheat size={16} /> {t("Wholesale Feed Pool")} ({bulkOrders.length})
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wheat size={24} className="text-amber-600 shrink-0" />
            {t("Wholesale Feed Purchasing Pool")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t("Pool feed orders with regional cooperative member farms to unlock 15% wholesale volume discounts.")}
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wheat size={20} className="text-amber-600" /> {t("Cooperative Bulk Feed & Wholesale Purchasing Pool")}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <select
              value={bulkFeedType}
              onChange={(e) => setBulkFeedType(e.target.value)}
              className="p-3 border border-amber-200 rounded-xl font-semibold bg-white outline-none"
            >
              <option value="Layer Mash (Bulk 50kg)">{t("Layer Mash (Bulk 50kg)")}</option>
              <option value="Broiler Finisher (Bulk 50kg)">{t("Broiler Finisher (Bulk 50kg)")}</option>
              <option value="Yellow Maize (Ton Bags)">{t("Yellow Maize (Ton Bags)")}</option>
              <option value="Soybean Meal (Ton Bags)">{t("Soybean Meal (Ton Bags)")}</option>
            </select>

            <input 
              type="number"
              placeholder={t("Quantity (Bags)")}
              value={bulkBags}
              onChange={(e) => setBulkBags(e.target.value)}
              className="p-3 border border-amber-200 rounded-xl font-semibold bg-white outline-none"
            />

            <button
              onClick={handleCreateBulkOrder}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-3 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Wheat size={16} /> {t("Join Wholesale Feed Pool")}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 tracking-wider">{t("Active Bulk Orders")} ({bulkOrders.length})</h4>
            {bulkOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                {t("No active wholesale feed pool orders. Pool orders to unlock 15% discount on maize and feeds.")}
              </div>
            ) : (
              bulkOrders.map((o) => (
                <div key={o.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{t(o.feedType) || o.feedType} ({formatNumber(o.quantityBags)} {t("Quantity (Bags)")})</span>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{t("Wholesale Discount: 15% Off")} ({formatCurrency(o.discountPrice || 12500)}/bag)</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2.5 py-1 rounded uppercase font-mono">
                    {t(o.status || 'Processing Pool')}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
