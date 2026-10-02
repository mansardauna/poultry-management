'use strict';
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { Plus, BarChart2, AlertTriangle, MapPin, Truck, Edit2, Trash2, Download, Printer } from 'lucide-react';
import { downloadCSV, printBrandedReport } from '@/lib/exportReports';
import { useLanguage } from "../LanguageContext";
import { useTimeFilter } from "../TimeFilterContext";
import { FeedInventory, DailyFeedLog, ChickenBatch, ProcurePipeline } from "@/data/types";
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * Props for the FeedClient component.
 */
interface FeedClientProps {
  initialFeeds: FeedInventory[];
  initialLogs: DailyFeedLog[];
  batches: ChickenBatch[];
  initialProcurePipeline: ProcurePipeline[];
  role: string;
}

/**
 * Client component for managing feed inventory and logs.
 * @param {FeedClientProps} props - The component props.
 */
export function FeedClient({ initialFeeds, initialLogs, batches, initialProcurePipeline, role }: FeedClientProps) {
  const [feeds, setFeeds] = useState<FeedInventory[]>(initialFeeds);
  const { texts, t, formatNumber } = useLanguage();
  const { filterByTimeRange, timeRange } = useTimeFilter();
  const canEdit = role === 'Admin' || role === 'Manager';
  const [logs, setLogs] = useState<DailyFeedLog[]>(initialLogs);
  const [procurePipeline, setProcurePipeline] = useState<ProcurePipeline[]>(initialProcurePipeline);
  
  const handleExportReports = (format: 'csv' | 'pdf') => {
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Feed Type', key: 'type' },
      { header: 'Stock Remaining (Kg)', key: 'quantityKg' },
      { header: 'Cost Per Bag (₦)', key: 'costPerBag' },
    ];

    if (format === 'csv') {
      downloadCSV(feeds, columns, 'feed_inventory_report.csv');
      toast.success('Feed inventory CSV report downloaded!');
    } else {
      printBrandedReport('Feed Stock & Consumption Audit', feeds, columns);
    }
  };
  
  // Modals state
  const [openUsage, setOpenUsage] = useState(false);
  const [openRestock, setOpenRestock] = useState(false);
  const [openLogistics, setOpenLogistics] = useState(false);
  const [openEditLog, setOpenEditLog] = useState(false);
  const [openEditPipeline, setOpenEditPipeline] = useState(false);
  
  // Edit states
  const [editLogId, setEditLogId] = useState<string | null>(null);
  const [editPipelineId, setEditPipelineId] = useState<string | null>(null);
  const [editLogQty, setEditLogQty] = useState('');
  const [editPipelineMilestone, setEditPipelineMilestone] = useState('');
  const [editPipelineSupplier, setEditPipelineSupplier] = useState('');
  const [editPipelineStatus, setEditPipelineStatus] = useState('');
  const [editPipelineEta, setEditPipelineEta] = useState('');
  
  // Usage form
  const [useFeedId, setUseFeedId] = useState(feeds[0]?.id || 'f1');
  const [useBatchId, setUseBatchId] = useState(batches[0]?.id || 'b1');
  const [useDate, setUseDate] = useState(new Date().toISOString().split('T')[0]);
  const [useQty, setUseQty] = useState('');

  // Restock form
  const [restockFeedId, setRestockFeedId] = useState(feeds[0]?.id || 'f1');
  const [restockQty, setRestockQty] = useState('');
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockCost, setRestockCost] = useState('');

  // Logistics Procurement Form State
  const [pipelineMilestone, setPipelineMilestone] = useState('');
  const [pipelineSupplier, setPipelineSupplier] = useState('Supreme Feed Mills Ltd.');
  const [pipelineStatus, setPipelineStatus] = useState('Under Contract');
  const [pipelineEta, setPipelineEta] = useState('');

  const inventoryLogic = useTableLogic({
    data: feeds,
    searchFields: ['type', 'supplier'],
    initialPageSize: 20
  });

  const pipelineLogic = useTableLogic({
    data: filterByTimeRange(procurePipeline),
    searchFields: ['milestone', 'supplier', 'status'],
    initialPageSize: 20
  });

  const logsLogic = useTableLogic({
    data: filterByTimeRange(logs),
    searchFields: ['date', 'batchId'],
    initialPageSize: 20
  });

  const refreshData = async () => {
    try {
      const res = await fetch('/api/feeds');
      if (res.ok) {
        const data = await res.json();
        setFeeds(data.feeds);
        setLogs(data.feedLogs);
        setProcurePipeline(data.procurePipeline);
      }
    } catch {}
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenUsage = () => setOpenUsage(true);
  const handleCloseUsage = () => {
    setOpenUsage(false);
    setUseFeedId(feeds[0]?.id || 'f1');
    setUseBatchId(batches[0]?.id || 'b1');
    setUseDate(new Date().toISOString().split('T')[0]);
    setUseQty('');
  };

  const handleOpenRestock = () => setOpenRestock(true);
  const handleCloseRestock = () => {
    setOpenRestock(false);
    setRestockFeedId(feeds[0]?.id || 'f1');
    setRestockQty('');
    setRestockSupplier('');
    setRestockCost('');
  };

  const handleOpenLogistics = () => setOpenLogistics(true);
  const handleCloseLogistics = () => {
    setOpenLogistics(false);
    setPipelineMilestone('');
    setPipelineSupplier('Supreme Feed Mills Ltd.');
    setPipelineStatus('Under Contract');
    setPipelineEta('');
  };

  const handleLogUsage = async () => {
    if (!useQty) return;

    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'usage',
          feedId: useFeedId,
          batchId: useBatchId,
          date: useDate,
          quantityKg: Number(useQty)
        })
      });

      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          const norm: DailyFeedLog = {
            id: String(created.id),
            date: created.date || useDate,
            feedId: String(created.feedId || useFeedId),
            quantityConsumedKg: Number(created.quantityConsumedKg) || Number(useQty) || 0,
            batchId: String(created.batchId || useBatchId)
          };
          setLogs((prev) => [norm, ...prev.filter((l) => l.id !== norm.id)]);
        }
        refreshData();
        handleCloseUsage();
        toast.success('Consumption logged! Inventory updated.');
      } else {
        toast.error('Failed to log feed usage');
      }
    } catch {}
  };

  const handleRestock = async () => {
    if (!restockQty) return;

    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restock',
          feedId: restockFeedId,
          quantityKg: Number(restockQty),
          supplier: restockSupplier,
          amountSpent: Number(restockCost) || 0
        })
      });

      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          const norm: FeedInventory = {
            id: String(created.id),
            type: String(created.type || 'Layer mash'),
            quantityKg: Number(created.quantityKg) || Number(restockQty) || 0,
            supplier: String(created.supplier || restockSupplier || 'Generic Supplier'),
            lastRestock: String(created.lastRestock || new Date().toISOString().split('T')[0])
          };
          setFeeds((prev) => [norm, ...prev.filter((f) => f.id !== norm.id)]);
        }
        refreshData();
        handleCloseRestock();
        toast.success('Stock received! Expense automatically logged.');
      } else {
        toast.error('Failed to record restock');
      }
    } catch {}
  };

  const handleLogLogistics = async () => {
    if (!pipelineMilestone) return;
    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logisticsProcure',
          milestone: pipelineMilestone,
          supplier: pipelineSupplier,
          status: pipelineStatus,
          eta: pipelineEta || 'Pending'
        })
      });

      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          const norm: ProcurePipeline = {
            id: String(created.id),
            date: String(created.date || new Date().toISOString().split('T')[0]),
            milestone: String(created.milestone || pipelineMilestone),
            supplier: String(created.supplier || pipelineSupplier || 'Generic Supplier'),
            status: String(created.status || pipelineStatus || 'Under Negotiations'),
            eta: String(created.eta || pipelineEta || 'Pending')
          };
          setProcurePipeline((prev) => [norm, ...prev.filter((p) => p.id !== norm.id)]);
        }
        refreshData();
        handleCloseLogistics();
        toast.success('Procurement milestone logged!');
      } else {
        toast.error('Failed to log logistics step');
      }
    } catch {}
  };

  // Edit Log Handlers
  const handleOpenEditLog = (log: DailyFeedLog) => {
    setEditLogId(log.id);
    setEditLogQty(String(log.quantityConsumedKg));
    setOpenEditLog(true);
  };

  const handleCloseEditLog = () => {
    setOpenEditLog(false);
    setEditLogId(null);
    setEditLogQty('');
  };

  const handleUpdateLog = async () => {
    if (!editLogId || !editLogQty) return;
    try {
      const res = await fetch('/api/feeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editLogId,
          quantityConsumedKg: Number(editLogQty)
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseEditLog();
        toast.success('Feed log updated!');
      } else {
        toast.error('Failed to update log');
      }
    } catch {}
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Delete this feed log?")) return;
    try {
      const res = await fetch('/api/feeds', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        refreshData();
        toast.success('Feed log deleted.');
      } else {
        toast.error('Failed to delete log');
      }
    } catch {}
  };

  // Edit Pipeline Handlers
  const handleOpenEditPipeline = (pipe: ProcurePipeline) => {
    setEditPipelineId(pipe.id);
    setEditPipelineMilestone(pipe.milestone);
    setEditPipelineSupplier(pipe.supplier);
    setEditPipelineStatus(pipe.status);
    setEditPipelineEta(pipe.eta);
    setOpenEditPipeline(true);
  };

  const handleCloseEditPipeline = () => {
    setOpenEditPipeline(false);
    setEditPipelineId(null);
    setEditPipelineMilestone('');
    setEditPipelineSupplier('');
    setEditPipelineStatus('');
    setEditPipelineEta('');
  };

  const handleUpdatePipeline = async () => {
    if (!editPipelineId || !editPipelineMilestone) return;
    try {
      const res = await fetch('/api/feeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePipeline',
          id: editPipelineId,
          milestone: editPipelineMilestone,
          supplier: editPipelineSupplier,
          status: editPipelineStatus,
          eta: editPipelineEta
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseEditPipeline();
        toast.success('Pipeline record updated!');
      } else {
        toast.error('Failed to update pipeline');
      }
    } catch {}
  };

  const handleDeletePipeline = async (id: string) => {
    if (!window.confirm("Delete this pipeline record?")) return;
    try {
      const res = await fetch('/api/feeds', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'deletePipeline' })
      });

      if (res.ok) {
        refreshData();
        toast.success('Pipeline record deleted.');
      } else {
        toast.error('Failed to delete pipeline');
      }
    } catch {}
  };

  const totalFeedKg = (feeds || []).reduce((sum, f) => sum + Number(f.quantityKg || 0), 0);
  const layerMash = (feeds || []).find(f => f.type === 'Layer mash');
  const isLayerMashCritical = layerMash && Number(layerMash.quantityKg || 0) <= 50;

  // Filter consumption logs based on the active timeframe
  const filteredLogs = filterByTimeRange(logs || []);
  const weeklyKgTotal = filteredLogs.reduce((sum, l) => sum + Number(l.quantityConsumedKg || 0), 0);

  // Per-type weekly breakdown
  const weeklyByType: Record<string, number> = {};
  filteredLogs.forEach(l => {
    const feed = (feeds || []).find(f => f.id === l.feedId);
    if (feed) weeklyByType[feed.type] = (weeklyByType[feed.type] || 0) + Number(l.quantityConsumedKg || 0);
  });

  const divisor = timeRange === 'weekly' ? 7 : timeRange === 'monthly' ? 30 : timeRange === 'yearly' ? 365 : 30;
  const dailyAvgConsumption = weeklyKgTotal / divisor;
  const daysOfSupply = dailyAvgConsumption > 0 ? Math.floor(totalFeedKg / dailyAvgConsumption) : null;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{texts.feed.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{texts.feed.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => handleExportReports('csv')}
            className="bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Download size={15} /> {t("Export CSV")}
          </button>
          <button 
            onClick={() => handleExportReports('pdf')}
            className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Printer size={15} /> {t("Print Report")}
          </button>
          <button 
            onClick={() => setOpenLogistics(true)}
            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Truck size={15} /> {t("Logistics Pipeline")}
          </button>
          <button 
            onClick={handleOpenUsage}
            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            {t("Log Usage")}
          </button>
          <button 
            onClick={handleOpenRestock}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> {texts.feed?.receiveStock || t("Receive Stock")}
          </button>
        </div>
      </div>

      {/* Critical Shortfall Alert Banner - Compact & Responsive */}
      {isLayerMashCritical && (
        <div className="border border-red-300 bg-red-50/90 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle size={18} className="text-red-600 shrink-0 animate-pulse" />
            <div className="min-w-0 truncate">
              <span className="font-bold text-red-950">{t("Low Feed Alert")}: </span>
              <span className="text-red-800 font-medium">Layer mash is at {Number(layerMash?.quantityKg || 0)}kg (below 50kg threshold).</span>
            </div>
          </div>
          <button 
            onClick={handleOpenRestock}
            className="text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-xl shrink-0 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            {t("Restock")}
          </button>
        </div>
      )}

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{t("Total Stock")}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-1">{totalFeedKg.toLocaleString()} kg</p>
              </div>
              <div className="text-amber-500"><BarChart2 size={30} /></div>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <span className={`font-semibold px-2 py-0.5 ${daysOfSupply !== null && daysOfSupply <= 7 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {daysOfSupply !== null ? `~${daysOfSupply} ${t("days left")}` : t("No logs yet")}
              </span>
              <span className="text-slate-400 ml-2">{t("at current rate")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Consumed */}
        <Card className="hover:border-indigo-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{t("This week used")}</p>
                <p className="text-3xl font-semibold text-indigo-600 mt-1">{weeklyKgTotal.toFixed(1)} kg</p>
              </div>
              <div className="text-indigo-500"><BarChart2 size={30} /></div>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5">
                {dailyAvgConsumption.toFixed(1)} kg/{t("day")}
              </span>
              <span className="text-slate-400 ml-2">{t("daily average")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Per-type cards for first 2 feed types */}
        {feeds.slice(0, 2).map(feed => {
          const consumed = weeklyByType[feed.type] || 0;
          const isCritical = feed.quantityKg <= 50;
          return (
            <Card key={feed.id} className={`hover:border-indigo-300 transition-colors ${isCritical ? 'border-red-300' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{t(feed.type)}</p>
                    <p className={`text-3xl font-semibold mt-1 ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>
                      {feed.quantityKg.toLocaleString()} kg
                    </p>
                  </div>
                  <div className={isCritical ? 'text-red-400' : 'text-emerald-500'}><BarChart2 size={30} /></div>
                </div>
                <div className="mt-3 flex items-center text-xs gap-2">
                  <span className={`font-semibold px-2 py-0.5 ${isCritical ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                    {isCritical ? t('Critical') : t('Safe')}
                  </span>
                  <span className="text-slate-400">{consumed.toFixed(1)} {t("kg used this week")}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly consumption bar breakdown */}
      {feeds.length > 0 && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-800">
              {t("Weekly consumption by feed type")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {feeds.map(feed => {
              const consumed = weeklyByType[feed.type] || 0;
              const total = consumed + feed.quantityKg;
              const pct = total > 0 ? Math.min((consumed / total) * 100, 100) : 0;
              return (
                <div key={feed.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{t(feed.type)}</span>
                    <span className="text-slate-500">
                      <span className="text-amber-600 font-semibold">{consumed.toFixed(1)} {t("kg used")}</span>
                      {' / '}
                      <span className="text-indigo-600 font-semibold">{feed.quantityKg.toLocaleString()} {t("kg remaining")}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}      {/* Layout Split: Inventory Table vs Procurement Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Inventory Table */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 tracking-wider">
              {texts.feed.currentInventory}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4">
              <TableControls searchTerm={inventoryLogic.searchTerm} setSearchTerm={inventoryLogic.setSearchTerm} placeholder={t("Search inventory...")} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label={t("Type")} sortKey="type" currentSort={inventoryLogic.sortConfig} onSort={inventoryLogic.handleSort} />
                    <TableSortHeader label={t("Quantity (kg)")} sortKey="quantityKg" currentSort={inventoryLogic.sortConfig} onSort={inventoryLogic.handleSort} />
                    <TableSortHeader label={t("Supplier")} sortKey="supplier" currentSort={inventoryLogic.sortConfig} onSort={inventoryLogic.handleSort} />
                    <TableSortHeader label={t("Last Restock")} sortKey="lastRestock" currentSort={inventoryLogic.sortConfig} onSort={inventoryLogic.handleSort} />
                    <th className="px-4 py-3">{t("Status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryLogic.data.map((feed) => {
                    const isCritical = feed.quantityKg <= 50;
                    return (
                      <tr key={feed.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{feed.type}</td>
                        <td className={`px-4 py-3 font-semibold ${isCritical ? 'text-red-650' : 'text-indigo-600'}`}>
                          {feed.quantityKg.toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-slate-655 font-medium">{feed.supplier}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{feed.lastRestock}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 text-[9px] font-semibold ${
                            isCritical ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-indigo-105 text-indigo-800'
                          }`}>
                            {isCritical ? t('Critical Stock') : t('Safe stock')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <TablePagination 
                currentPage={inventoryLogic.currentPage}
                totalPages={inventoryLogic.totalPages}
                totalItems={inventoryLogic.totalItems}
                pageSize={inventoryLogic.pageSize}
                onPageChange={inventoryLogic.setCurrentPage}
                onPageSizeChange={inventoryLogic.setPageSize}
              />
            </div>
          </CardContent>
        </Card>

        {/* Restructuring Procurement Pipeline Logs */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 tracking-wider flex items-center gap-2">
              <Truck size="18" className="text-indigo-655" /> {t("Restructured Logistics Procurement Pipeline (DB Roster)")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[11px] text-slate-500 mb-4">
              {t("Restructured supply chains to securely lock down layer bird feed logistics and prevent future stock depletion.")}
            </p>
            <div className="mb-4">
              <TableControls searchTerm={pipelineLogic.searchTerm} setSearchTerm={pipelineLogic.setSearchTerm} placeholder={t("Search pipeline...")} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label={texts.common.date} sortKey="date" currentSort={pipelineLogic.sortConfig} onSort={pipelineLogic.handleSort} />
                    <TableSortHeader label={t("Milestone Action")} sortKey="milestone" currentSort={pipelineLogic.sortConfig} onSort={pipelineLogic.handleSort} />
                    <TableSortHeader label={t("New Supplier")} sortKey="supplier" currentSort={pipelineLogic.sortConfig} onSort={pipelineLogic.handleSort} />
                    <TableSortHeader label={t("Status")} sortKey="status" currentSort={pipelineLogic.sortConfig} onSort={pipelineLogic.handleSort} />
                    <TableSortHeader label={t("ETA")} sortKey="eta" currentSort={pipelineLogic.sortConfig} onSort={pipelineLogic.handleSort} />
                    {canEdit && <th className="px-4 py-3">{texts.common.actions}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {pipelineLogic.data.map((pipe) => (
                    <tr key={pipe.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{pipe.date}</td>
                      <td className="px-4 py-3 text-slate-900 font-semibold">{pipe.milestone}</td>
                      <td className="px-4 py-3 text-slate-655 font-semibold">{pipe.supplier}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-semibold ${
                          pipe.status && String(pipe.status).includes('Secured') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>{pipe.status || 'Under Contract'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">{pipe.eta}</td>
                      {canEdit && (
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleOpenEditPipeline(pipe)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title={t("Edit")}
                          >
                            <Edit2 size={14} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeletePipeline(pipe.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title={t("Delete")}
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <TablePagination 
                currentPage={pipelineLogic.currentPage}
                totalPages={pipelineLogic.totalPages}
                totalItems={pipelineLogic.totalItems}
                pageSize={pipelineLogic.pageSize}
                onPageChange={pipelineLogic.setCurrentPage}
                onPageSizeChange={pipelineLogic.setPageSize}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Logs */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-700 tracking-wider">
            {texts.feed.consumptionLogs}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4">
            <TableControls searchTerm={logsLogic.searchTerm} setSearchTerm={logsLogic.setSearchTerm} placeholder={t("Search logs...")} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableSortHeader label={texts.common.date} sortKey="date" currentSort={logsLogic.sortConfig} onSort={logsLogic.handleSort} />
                  <th className="px-4 py-3">{t("Feed Type")}</th>
                  <TableSortHeader label={t("Batch ID")} sortKey="batchId" currentSort={logsLogic.sortConfig} onSort={logsLogic.handleSort} />
                  <TableSortHeader label={t("Amount (kg)")} sortKey="quantityConsumedKg" currentSort={logsLogic.sortConfig} onSort={logsLogic.handleSort} />
                  {canEdit && <th className="px-4 py-3">{texts.common.actions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsLogic.data.map((log) => {
                  const feed = feeds.find(f => f.id === log.feedId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-950">{log.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-650">{feed?.type ? t(feed.type) : t('Unknown')}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{log.batchId}</td>
                      <td className="px-4 py-3 font-semibold text-amber-600">{log.quantityConsumedKg} kg</td>
                      {canEdit && (
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleOpenEditLog(log)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title={t("Edit")}
                          >
                            <Edit2 size={16} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title={t("Delete")}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <TablePagination 
              currentPage={logsLogic.currentPage}
              totalPages={logsLogic.totalPages}
              totalItems={logsLogic.totalItems}
              pageSize={logsLogic.pageSize}
              onPageChange={logsLogic.setCurrentPage}
              onPageSizeChange={logsLogic.setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Log Feed Usage Modal */}
      <Modal
        isOpen={openUsage}
        onClose={handleCloseUsage}
        title={t("Log Feed Consumption")}
        subtitle={t("Record daily feed bags or kg consumed by batch")}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label={t("Feed Type")}
            value={useFeedId}
            onChange={(e) => setUseFeedId(e.target.value)}
          >
            {feeds.map(f => (
              <option key={f.id} value={f.id}>{t(f.type)} ({Number(f.quantityKg || 0)}kg {t("available")})</option>
            ))}
          </Select>

          <Select
            label={t("Chicken Batch")}
            value={useBatchId}
            onChange={(e) => setUseBatchId(e.target.value)}
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.id} ({b.breed || 'Flock'} - {b.type})</option>
            ))}
          </Select>

          <Input
            label={t("Quantity Consumed (kg)")}
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 50"
            value={useQty}
            onChange={(e) => setUseQty(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCloseUsage}>{t("Cancel")}</Button>
            <Button variant="primary" disabled={!useQty} onClick={handleLogUsage}>{t("Log Usage")}</Button>
          </div>
        </div>
      </Modal>

      {/* Receive Stock Modal */}
      <Modal
        isOpen={openRestock}
        onClose={handleCloseRestock}
        title={t("Receive Stock (Restock)")}
        subtitle={t("Add new feed bags to inventory & log expense")}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label={t("Feed Type")}
            value={restockFeedId}
            onChange={(e) => setRestockFeedId(e.target.value)}
          >
            {feeds.map(f => (
              <option key={f.id} value={f.id}>{t(f.type)}</option>
            ))}
          </Select>

          <Input
            label={t("Restock Quantity (kg)")}
            type="number"
            min="0"
            placeholder="e.g. 500"
            value={restockQty}
            onChange={(e) => setRestockQty(e.target.value)}
          />

          <Input
            label={t("Supplier / Feed Mill")}
            type="text"
            placeholder="e.g. Supreme Feed Mills Ltd."
            value={restockSupplier}
            onChange={(e) => setRestockSupplier(e.target.value)}
          />

          <Input
            label={t("Procurement Cost (₦) - Auto Logs Expense")}
            type="number"
            min="0"
            placeholder="e.g. 150000"
            value={restockCost}
            onChange={(e) => setRestockCost(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCloseRestock}>{t("Cancel")}</Button>
            <Button variant="primary" disabled={!restockQty} onClick={handleRestock}>{t("Log Restock")}</Button>
          </div>
        </div>
      </Modal>

      {/* Logistics Procurement Pipeline Modal */}
      <Modal
        isOpen={openLogistics}
        onClose={handleCloseLogistics}
        title={t("Log Logistics Procurement Step")}
        subtitle={t("Track partner contracts, supply routes & expected deliveries")}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t("Pipeline Milestone Action")}
            type="text"
            placeholder="e.g. Completed supply contract negotiations"
            value={pipelineMilestone}
            onChange={(e) => setPipelineMilestone(e.target.value)}
          />

          <Select
            label={t("Partner Supplier")}
            value={pipelineSupplier}
            onChange={(e) => setPipelineSupplier(e.target.value)}
          >
            <option value="Supreme Feed Mills Ltd.">Supreme Feed Mills Ltd.</option>
            <option value="AgroFeeds Logistics Team">AgroFeeds Logistics Team</option>
            <option value="Local Coop Supplier Hub">Local Coop Supplier Hub</option>
          </Select>

          <Select
            label={t("Restructured Status")}
            value={pipelineStatus}
            onChange={(e) => setPipelineStatus(e.target.value)}
          >
            <option value="Secured (Awaiting Transit)">{t("Secured (Awaiting Transit)")}</option>
            <option value="In Transit (Shipping)">{t("In Transit (Shipping)")}</option>
            <option value="Under Contract">{t("Under Contract")}</option>
            <option value="Completed System Check">{t("Completed System Check")}</option>
          </Select>

          <Input
            label={t("Estimated Arrival (ETA)")}
            type="text"
            placeholder="e.g. Immediate, or 2026-06-15"
            value={pipelineEta}
            onChange={(e) => setPipelineEta(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCloseLogistics}>{t("Cancel")}</Button>
            <Button variant="primary" disabled={!pipelineMilestone} onClick={handleLogLogistics}>{t("Log Logistics Step")}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Consumption Log Modal */}
      <Modal
        isOpen={openEditLog}
        onClose={handleCloseEditLog}
        title={t("Edit Feed Consumption")}
        subtitle={t("Update quantity consumed for this log entry")}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={t("Quantity Consumed (kg)")}
            type="number"
            min="0"
            value={editLogQty}
            onChange={(e) => setEditLogQty(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCloseEditLog}>{t("Cancel")}</Button>
            <Button variant="primary" disabled={!editLogQty} onClick={handleUpdateLog}>{t("Update Log")}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Pipeline Modal */}
      <Modal
        isOpen={openEditPipeline}
        onClose={handleCloseEditPipeline}
        title={t("Edit Procurement Pipeline")}
        subtitle={t("Update milestone status and estimated arrival date")}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t("Milestone Action")}
            type="text"
            value={editPipelineMilestone}
            onChange={(e) => setEditPipelineMilestone(e.target.value)}
          />

          <Input
            label={t("Supplier / Mill")}
            type="text"
            value={editPipelineSupplier}
            onChange={(e) => setEditPipelineSupplier(e.target.value)}
          />

          <Select
            label={t("Status")}
            value={editPipelineStatus}
            onChange={(e) => setEditPipelineStatus(e.target.value)}
          >
            <option value="Under Negotiations">{t("Under Negotiations")}</option>
            <option value="Under Contract">{t("Under Contract")}</option>
            <option value="Secured">{t("Secured")}</option>
            <option value="Delivered">{t("Delivered")}</option>
          </Select>

          <Input
            label={t("Estimated Arrival (ETA)")}
            type="text"
            placeholder="e.g. 2026-06-15"
            value={editPipelineEta}
            onChange={(e) => setPipelineEta(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCloseEditPipeline}>{t("Cancel")}</Button>
            <Button variant="primary" disabled={!editPipelineMilestone} onClick={handleUpdatePipeline}>{t("Update Pipeline")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
