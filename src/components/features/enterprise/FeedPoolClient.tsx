'use strict';
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Wheat, Sparkles, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface FeedPoolClientProps {
  tier: string;
  bulkOrders?: any[];
}

export function FeedPoolClient({ tier, bulkOrders: initialBulkOrders = [] }: FeedPoolClientProps) {
  const router = useRouter();
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
        toast.success(`Wholesale Feed Procurement Order created for ${bags} bags!`);
      }
    } catch (_e) {
      toast.error('Failed to submit bulk order');
    }
  };

  if (!isEnterprise) {
    return (
      <div className="space-y-6 max-w-4xl pb-16 font-sans">
        <div className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30 animate-pulse">
            <Wheat size={40} />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow">
              ENTERPRISE TIER REQUIRED
            </span>
            <h2 className="text-3xl font-extrabold text-white">Wholesale Feed & Procurement Pool</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pooling feed orders (Maize, Soybean, Layer Mash) with cooperative partner farms to unlock 15% bulk discounts is exclusively available on Enterprise Plus.
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> Enterprise Suite
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              WHOLESALE FEED POOL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Cooperative Wholesale Feed Purchasing Pool</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Pool feed orders with regional cooperative member farms to unlock 15% wholesale volume discounts.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wheat size={20} className="text-amber-600" /> Cooperative Bulk Feed & Wholesale Purchasing Pool
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <select
              value={bulkFeedType}
              onChange={(e) => setBulkFeedType(e.target.value)}
              className="p-3 border border-amber-200 rounded-xl font-semibold bg-white outline-none"
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
              className="p-3 border border-amber-200 rounded-xl font-semibold bg-white outline-none"
            />

            <button
              onClick={handleCreateBulkOrder}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-3 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Wheat size={16} /> Join Wholesale Feed Pool
            </button>
          </div>

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
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2.5 py-1 rounded uppercase font-mono">
                    {o.status || 'Processing Pool'}
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
