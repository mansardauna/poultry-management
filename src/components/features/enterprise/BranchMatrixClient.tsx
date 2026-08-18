'use strict';
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Building2, 
  Trash2, 
  ArrowRightLeft, 
  Plus, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2,
  AlertTriangle,
  Layers,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '../WorkspaceContext';

interface BranchMatrixClientProps {
  tier: string;
  workspaces: any[];
  branchMetrics?: Record<string, { totalBirds: number; totalEggs: number; feedStockKg: number; revenue: number }>;
}

export function BranchMatrixClient({ tier, workspaces: initialWorkspaces, branchMetrics = {} }: BranchMatrixClientProps) {
  const router = useRouter();
  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const { setActiveWorkspace, activeWorkspace, deleteWorkspace } = useWorkspace();
  const [workspaces, setWorkspaces] = useState<any[]>(initialWorkspaces);

  // Transfer Stock Modal State
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [fromBranchId, setFromBranchId] = useState(workspaces[0]?.id || 'main');
  const [toBranchId, setToBranchId] = useState(workspaces[1]?.id || workspaces[0]?.id || 'main');
  const [transferItemType, setTransferItemType] = useState('Egg Crates');
  const [transferQuantity, setTransferQuantity] = useState('50');
  const [transferNotes, setTransferNotes] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Delete Branch Modal State
  const [deletingBranch, setDeletingBranch] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handler: Execute Stock Transfer
  const handleExecuteTransfer = async () => {
    if (fromBranchId === toBranchId) {
      toast.error('Source and Destination branch must be different!');
      return;
    }
    const qty = Number(transferQuantity);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid transfer quantity');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_stock',
          fromBranchId,
          toBranchId,
          itemType: transferItemType,
          quantity: qty,
          notes: transferNotes
        })
      });
      if (res.ok) {
        toast.success(`Successfully transferred ${qty} ${transferItemType} to destination branch!`);
        setOpenTransferModal(false);
        setTransferNotes('');
        router.refresh();
      } else {
        toast.error('Failed to execute stock transfer');
      }
    } catch (_e) {
      toast.error('Error during stock transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  // Handler: Permanent Delete Branch
  const handleConfirmDeleteBranch = async () => {
    if (!deletingBranch) return;
    if (deletingBranch.id === 'main') {
      toast.error('Cannot delete the primary main farm branch');
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Call Enterprise API delete action
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_branch', branchId: deletingBranch.id })
      });

      // 2. Call WorkspaceContext delete
      try {
        await deleteWorkspace(deletingBranch.id);
      } catch (_e) {}

      if (res.ok) {
        setWorkspaces(prev => prev.filter(w => w.id !== deletingBranch.id));
        toast.success(`Branch "${deletingBranch.name}" permanently deleted!`);
        setDeletingBranch(null);
        router.refresh();
      } else {
        toast.error('Failed to delete branch');
      }
    } catch (_e) {
      toast.error('Error deleting branch');
    } finally {
      setIsDeleting(false);
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
            <h2 className="text-3xl font-extrabold text-white">Multi-Farm Matrix & Stock Transfers</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Multi-farm matrix management, inter-branch stock transfers, and branch performance leaderboards are exclusively available on Enterprise Plus.
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

  // Compute real totals
  const totalBirdsAll = Object.values(branchMetrics).reduce((acc, curr) => acc + curr.totalBirds, 0);
  const totalEggsAll = Object.values(branchMetrics).reduce((acc, curr) => acc + curr.totalEggs, 0);

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> Enterprise Suite
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              BRANCH MATRIX & TRANSFERS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Multi-Farm Branch Matrix</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Real live aggregated metrics per branch, cross-branch stock transfers, and permanent branch management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOpenTransferModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <ArrowRightLeft size={16} /> Transfer Stock Between Branches
          </button>
        </div>
      </div>

      {/* 1. Branch Performance Matrix Cards */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-600" /> Active Farm Locations ({workspaces.length})
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Real live telemetry aggregated from database records across all farm branches</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/settings?tab=subscription')}
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

                    <button
                      onClick={() => setDeletingBranch(ws)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                      title="Permanently Delete Branch"
                    >
                      <Trash2 size={16} />
                    </button>
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

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setActiveWorkspace(ws);
                        toast.success(`Switched active workspace to "${ws.name}"`);
                      }}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isActive ? 'Currently Active' : 'Switch Workspace'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Cross-Branch Stock Transfer Modal */}
      {openTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-indigo-400" />
                <h3 className="font-extrabold text-sm uppercase">Cross-Branch Stock Transfer</h3>
              </div>
              <button onClick={() => setOpenTransferModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Source Branch (From) *</label>
                <select
                  value={fromBranchId}
                  onChange={(e) => setFromBranchId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none bg-slate-50"
                >
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Destination Branch (To) *</label>
                <select
                  value={toBranchId}
                  onChange={(e) => setToBranchId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none bg-slate-50"
                >
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transfer Item Type *</label>
                <select
                  value={transferItemType}
                  onChange={(e) => setTransferItemType(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none bg-slate-50"
                >
                  <option>Egg Crates</option>
                  <option>Feed Bags (50kg)</option>
                  <option>Bird Batches (Layers/Broilers)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Quantity to Transfer *</label>
                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transfer Notes / Reason</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none"
                  placeholder="e.g. Stock balancing for Maitama Branch"
                />
              </div>

              <button
                onClick={handleExecuteTransfer}
                disabled={isTransferring}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow cursor-pointer transition-colors"
              >
                {isTransferring ? 'Executing Stock Transfer...' : 'Execute Stock Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Branch Confirm Modal */}
      {deletingBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-red-200">
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                <h3 className="font-extrabold text-sm uppercase">Permanently Delete Branch</h3>
              </div>
              <button onClick={() => setDeletingBranch(null)} className="text-white hover:text-red-200 cursor-pointer">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed font-semibold">
                Are you sure you want to permanently delete farm branch <strong className="text-slate-950">"{deletingBranch.name}"</strong>?
              </p>
              <p className="text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                ⚠️ Warning: This action will permanently remove this branch location from your Supabase database.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingBranch(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDeleteBranch}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
