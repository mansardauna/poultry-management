'use strict';
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BadgeStatus } from "@/components/ui/BadgeStatus";
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
import { WorkspaceOnboarding } from '../WorkspaceOnboarding';
import { useLanguage } from '@/components/features/LanguageContext';

interface BranchMatrixClientProps {
  tier: string;
  workspaces: any[];
  branchMetrics?: Record<string, { totalBirds: number; totalEggs: number; feedStockKg: number; revenue: number }>;
}

export function BranchMatrixClient({ tier, workspaces: initialWorkspaces, branchMetrics = {} }: BranchMatrixClientProps) {
  const router = useRouter();
  const { t, formatCurrency, formatNumber } = useLanguage();
  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const { setActiveWorkspace, activeWorkspace, deleteWorkspace } = useWorkspace();
  const [workspaces, setWorkspaces] = useState<any[]>(initialWorkspaces);
  const [showAddModal, setShowAddModal] = useState(false);

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
      toast.error(t('Source and Destination branch must be different!'));
      return;
    }
    const qty = Number(transferQuantity);
    if (!qty || qty <= 0) {
      toast.error(t('Please enter a valid transfer quantity'));
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
        toast.success(t(`Successfully transferred ${qty} ${transferItemType} to destination branch!`));
        setOpenTransferModal(false);
        setTransferNotes('');
        router.refresh();
      } else {
        toast.error(t('Failed to execute stock transfer'));
      }
    } catch (_e) {
      toast.error(t('Error during stock transfer'));
    } finally {
      setIsTransferring(false);
    }
  };

  // Handler: Permanent Delete Branch
  const handleConfirmDeleteBranch = async () => {
    if (!deletingBranch) return;
    if (deletingBranch.id === 'main') {
      toast.error(t('Cannot delete the primary main farm branch'));
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
        toast.success(`${t('Branch')} "${deletingBranch.name}" ${t('permanently deleted!')}`);
        setDeletingBranch(null);
        router.refresh();
      } else {
        toast.error(t('Failed to delete branch'));
      }
    } catch (_e) {
      toast.error(t('Error deleting branch'));
    } finally {
      setIsDeleting(false);
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
            <h2 className="text-2xl font-extrabold text-slate-900 pt-1">{t("Multi-Farm Matrix & Stock Transfers")}</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t("Multi-farm matrix management, inter-branch stock transfers, and branch performance leaderboards are exclusively available on Enterprise Plus.")}
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

  // Compute real totals
  const totalBirdsAll = Object.values(branchMetrics).reduce((acc, curr) => acc + curr.totalBirds, 0);
  const totalEggsAll = Object.values(branchMetrics).reduce((acc, curr) => acc + curr.totalEggs, 0);

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Top Enterprise Sub-Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1 text-xs font-bold tracking-wider">
        <button
          onClick={() => router.push('/dashboard/enterprise/branches')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap bg-indigo-600 text-white shadow-md"
        >
          <Building2 size={16} /> {t("Branch Matrix")} ({workspaces.length})
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/whitelabel')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Sparkles size={16} /> {t("White-Label & Themes")}
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
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Layers size={16} /> {t("Wholesale Feed Pool")}
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 size={24} className="text-indigo-600 shrink-0" />
            {t("Multi-Farm Branch Matrix")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t("Real live aggregated metrics per branch, cross-branch stock transfers, and permanent branch management.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setOpenTransferModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ArrowRightLeft size={15} /> {t("Transfer Stock")}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} /> {t("Add Farm Branch")}
          </button>
        </div>
      </div>

      {/* 1. Branch Performance Matrix Cards */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600 shrink-0" /> {t("Farm Branch Matrix & Operations")} ({workspaces.length})
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{t("Across all branch farms")}</p>
          </div>
        </CardHeader>

        {showAddModal && (
          <WorkspaceOnboarding onClose={() => { setShowAddModal(false); router.refresh(); }} />
        )}

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
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isActive ? t('Active') : `${t('Location / Region')} #${i + 1}`}
                    </span>

                    <button
                      onClick={() => setDeletingBranch(ws)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                      title={t("Delete Farm Branch")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{ws.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{ws.type || t('Main Farm (Primary)')}</p>
                  </div>

                  {/* Real Database Telemetry Stats */}
                  <div className="pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700 font-mono">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold block font-sans">{t("Flock Headcount")}</span>
                      <span className="text-sm font-bold text-slate-900">{formatNumber(bm.totalBirds)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold block font-sans">{t("Egg Output")}</span>
                      <span className="text-sm font-bold text-emerald-600">{formatNumber(Math.floor(bm.totalEggs / 30))} {t("Egg Crates")}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold block font-sans">{t("Feed Stock")}</span>
                      <span className="text-sm font-bold text-indigo-600">{formatNumber(bm.feedStockKg)} Kg</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold block font-sans">{t("Revenue")}</span>
                      <span className="text-sm font-bold text-amber-600">{formatCurrency(bm.revenue)}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setActiveWorkspace(ws);
                        toast.success(`${t('Switch to Branch')}: "${ws.name}"`);
                      }}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isActive ? t('Active') : t('Switch to Branch')}
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-indigo-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">{t("Transfer Stock Between Branches")}</h3>
              </div>
              <button onClick={() => setOpenTransferModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 text-sm">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t("Source Farm Branch")} *</label>
                <select
                  value={fromBranchId}
                  onChange={(e) => setFromBranchId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none bg-slate-50"
                >
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t("Destination Farm Branch")} *</label>
                <select
                  value={toBranchId}
                  onChange={(e) => setToBranchId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none bg-slate-50"
                >
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t("Item Category / Type")} *</label>
                <select
                  value={transferItemType}
                  onChange={(e) => setTransferItemType(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none bg-slate-50"
                >
                  <option value="Egg Crates">{t("Egg Crates")}</option>
                  <option value="Feed Bags (50kg)">{t("Feed Bags (50kg)")}</option>
                  <option value="Live Birds">{t("Live Birds")}</option>
                  <option value="Vaccines & Meds">{t("Vaccines & Meds")}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t("Quantity to Transfer")} *</label>
                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t("Transfer Memo / Notes (Optional)")}</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none"
                  placeholder={t("Transfer Memo / Notes (Optional)")}
                />
              </div>

              <button
                onClick={handleExecuteTransfer}
                disabled={isTransferring}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow cursor-pointer transition-colors"
              >
                {isTransferring ? t('Transferring...') : t('Confirm Transfer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Branch Confirm Modal */}
      {deletingBranch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">{t("Delete Farm Branch")}</h3>
              </div>
              <button onClick={() => setDeletingBranch(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 text-sm">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed font-semibold">
                {t("Are you sure you want to permanently delete")} <strong className="text-slate-950">"{deletingBranch.name}"</strong>?
              </p>
              <div className="text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{t("This will remove the workspace and disassociate its records.")}</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingBranch(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t("Cancel")}
                </button>

                <button
                  onClick={handleConfirmDeleteBranch}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow"
                >
                  {isDeleting ? t('Deleting...') : t('Yes, Delete Branch')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
