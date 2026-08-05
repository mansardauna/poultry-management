'use strict';
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { Plus, BarChart2, AlertTriangle, CheckSquare, Edit2, Trash2, Download, Printer } from 'lucide-react';
import { downloadCSV, printBrandedReport } from '@/lib/exportReports';
import { useRouter } from 'next/navigation';
import { useLanguage } from "../LanguageContext";
import { useTimeFilter } from "../TimeFilterContext";
import { EggRecord, ChickenBatch, CushionAudit, MaturationLog } from "@/data/types";
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button as MuiButton 
} from '@mui/material';

/**
 * Props for the EggsClient component.
 */
interface EggsClientProps {
  initialEggs: EggRecord[];
  batches: ChickenBatch[];
  initialCushionAudits: CushionAudit[];
  initialMaturationLogs: MaturationLog[];
  role: string;
}

/**
 * Client component for managing egg records, cushion audits, and maturation logs.
 * @param {EggsClientProps} props - The component props.
 */
export function EggsClient({ initialEggs, batches, initialCushionAudits, initialMaturationLogs, role }: EggsClientProps) {
  const [eggs, setEggs] = useState<EggRecord[]>(initialEggs);
  const { texts } = useLanguage();
  const { filterByTimeRange } = useTimeFilter();
  const router = useRouter();
  const [tier, setTier] = useState('free');
  useEffect(() => {
    const match = document.cookie.match(/pfms_tier=([^;]+)/);
    if (match) setTier(match[1]);
  }, []);

  const handleExportReports = (format: 'csv' | 'pdf') => {
    if (tier === 'free') {
      toast.error('Exporting PDF and CSV reports is a Pro feature. Upgrade to unlock!');
      router.push('/dashboard/settings?tab=subscription');
      return;
    }

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Date', key: 'date' },
      { header: 'Batch ID', key: 'batchId' },
      { header: 'Good Eggs', key: 'goodEggs' },
      { header: 'Broken Eggs', key: 'brokenEggs' },
      { header: 'Spoilt Eggs', key: 'spoiltEggs' },
    ];

    if (format === 'csv') {
      downloadCSV(filteredEggs, columns, 'egg_production_report.csv');
      toast.success('Egg production CSV report downloaded!');
    } else {
      printBrandedReport('Daily Egg Production & Quality Audit', filteredEggs, columns);
    }
  };

  const canEdit = true; // Allow all staff to correct their logs
  const [cushionAudits, setCushionAudits] = useState<CushionAudit[]>(initialCushionAudits);
  const [maturationLogs, setMaturationLogs] = useState<MaturationLog[]>(initialMaturationLogs);

  const cushionAuditsLogic = useTableLogic({
    data: filterByTimeRange(cushionAudits),
    searchFields: ['boxName', 'status', 'actionTaken', 'date'],
    initialPageSize: 20
  });

  const maturationLogsLogic = useTableLogic({
    data: filterByTimeRange(maturationLogs),
    searchFields: ['birdId', 'notes', 'date'],
    initialPageSize: 20
  });

  const eggsLogic = useTableLogic({
    data: filterByTimeRange(eggs),
    searchFields: ['batchId', 'date'],
    initialPageSize: 20
  });
  // Modals state
  const [openCollect, setOpenCollect] = useState(false);
  const [openAudit, setOpenAudit] = useState(false);
  const [openMaturation, setOpenMaturation] = useState(false);
  const [openEditCollection, setOpenEditCollection] = useState(false);
  const [openEditAudit, setOpenEditAudit] = useState(false);
  const [openEditMaturation, setOpenEditMaturation] = useState(false);

  // Edit states
  const [editCollectionId, setEditCollectionId] = useState<string | null>(null);
  const [editAuditId, setEditAuditId] = useState<string | null>(null);
  const [editMaturationId, setEditMaturationId] = useState<string | null>(null);
  const [editGoodEggs, setEditGoodEggs] = useState('');
  const [editBrokenEggs, setEditBrokenEggs] = useState('');
  const [editSpoiltEggs, setEditSpoiltEggs] = useState('');
  const [editAuditBox, setEditAuditBox] = useState('');
  const [editAuditCondition, setEditAuditCondition] = useState('');
  const [editAuditActionTaken, setEditAuditActionTaken] = useState('');
  const [editMaturationBirdId, setEditMaturationBirdId] = useState('');
  const [editMaturationEggsCount, setEditMaturationEggsCount] = useState('');
  const [editMaturationWeight, setEditMaturationWeight] = useState('');
  const [editMaturationNotes, setEditMaturationNotes] = useState('');

  // New Collection Form
  const [collectBatchId, setCollectBatchId] = useState(batches[0]?.id || 'b1');
  const [collectDate, setCollectDate] = useState(new Date().toISOString().split('T')[0]);
  const [goodEggs, setGoodEggs] = useState('');
  const [brokenEggs, setBrokenEggs] = useState('');
  const [spoiltEggs, setSpoiltEggs] = useState('');

  // Cushioning Audits Form State
  const [auditBox, setAuditBox] = useState('Box #4');
  const [auditCondition, setAuditCondition] = useState('Compressed - Low Straw');
  const [auditActionTaken, setAuditActionTaken] = useState('');

  // Newly Laying Birds Maturation Form State
  const [maturationBirdId, setMaturationBirdId] = useState('Bird-NL01');
  const [maturationEggsCount, setMaturationEggsCount] = useState('');
  const [maturationWeight, setMaturationWeight] = useState('');
  const [maturationNotes, setMaturationNotes] = useState('');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/eggs');
      if (res.ok) {
        const data = await res.json();
        setEggs(data.eggs);
        setCushionAudits(data.cushionAudits);
        setMaturationLogs(data.maturationLogs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCollect = () => setOpenCollect(true);
  const handleCloseCollect = () => {
    setOpenCollect(false);
    setCollectBatchId(batches[0]?.id || 'b1');
    setCollectDate(new Date().toISOString().split('T')[0]);
    setGoodEggs('');
    setBrokenEggs('');
    setSpoiltEggs('');
  };

  const handleOpenAudit = () => setOpenAudit(true);
  const handleCloseAudit = () => {
    setOpenAudit(false);
    setAuditBox('Box #4');
    setAuditCondition('Compressed - Low Straw');
    setAuditActionTaken('');
  };

  const handleOpenMaturation = () => setOpenMaturation(true);
  const handleCloseMaturation = () => {
    setOpenMaturation(false);
    setMaturationBirdId('Bird-NL01');
    setMaturationEggsCount('');
    setMaturationWeight('');
    setMaturationNotes('');
  };

  const handleCollect = async () => {
    if (!goodEggs) return;

    try {
      const res = await fetch('/api/eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: collectBatchId,
          date: collectDate,
          goodEggs: Number(goodEggs),
          brokenEggs: Number(brokenEggs) || 0,
          spoiltEggs: Number(spoiltEggs) || 0
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseCollect();
        toast.success('Egg collection logged!');
      } else {
        toast.error('Failed to record collection');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogAudit = async () => {
    try {
      const res = await fetch('/api/eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cushionAudit',
          boxName: auditBox,
          status: auditCondition,
          actionTaken: auditActionTaken || (auditCondition === 'Compressed - Low Straw' ? 'Refilled straw & added box cushioning' : 'Standard check complete')
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseAudit();
        toast.success('Cushion audit registered!');
      } else {
        toast.error('Failed to register audit');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogMaturation = async () => {
    if (!maturationEggsCount || !maturationWeight) return;
    try {
      const res = await fetch('/api/eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'maturation',
          birdId: maturationBirdId,
          breed: 'Isa Brown',
          eggsCount: Number(maturationEggsCount),
          avgWeightGrams: Number(maturationWeight),
          notes: maturationNotes || 'Maturing normally'
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseMaturation();
        toast.success('Maturation log recorded!');
      } else {
        toast.error('Failed to record maturation log');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Collection Handlers
  const handleOpenEditCollection = (egg: EggRecord) => {
    setEditCollectionId(egg.id);
    setEditGoodEggs(String(egg.goodEggs));
    setEditBrokenEggs(String(egg.brokenEggs));
    setEditSpoiltEggs(String(egg.spoiltEggs));
    setOpenEditCollection(true);
  };

  const handleCloseEditCollection = () => {
    setOpenEditCollection(false);
    setEditCollectionId(null);
    setEditGoodEggs('');
    setEditBrokenEggs('');
    setEditSpoiltEggs('');
  };

  const handleUpdateCollection = async () => {
    if (!editCollectionId || !editGoodEggs) return;
    try {
      const res = await fetch('/api/eggs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editCollectionId,
          goodEggs: Number(editGoodEggs),
          brokenEggs: Number(editBrokenEggs) || 0,
          spoiltEggs: Number(editSpoiltEggs) || 0
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseEditCollection();
        toast.success('Collection record updated!');
      } else {
        toast.error('Failed to update collection');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm("Delete this collection record?")) return;
    try {
      const res = await fetch('/api/eggs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        refreshData();
        toast.success('Collection record deleted.');
      } else {
        toast.error('Failed to delete collection');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Audit Handlers
  const handleOpenEditAudit = (audit: CushionAudit) => {
    setEditAuditId(audit.id);
    setEditAuditBox(audit.boxName);
    setEditAuditCondition(audit.status);
    setEditAuditActionTaken(audit.actionTaken);
    setOpenEditAudit(true);
  };

  const handleCloseEditAudit = () => {
    setOpenEditAudit(false);
    setEditAuditId(null);
    setEditAuditBox('');
    setEditAuditCondition('');
    setEditAuditActionTaken('');
  };

  const handleUpdateAudit = async () => {
    if (!editAuditId || !editAuditBox) return;
    try {
      const res = await fetch('/api/eggs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAudit',
          id: editAuditId,
          boxName: editAuditBox,
          status: editAuditCondition,
          actionTaken: editAuditActionTaken
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseEditAudit();
        toast.success('Audit record updated!');
      } else {
        toast.error('Failed to update audit');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAudit = async (id: string) => {
    if (!window.confirm("Delete this audit record?")) return;
    try {
      const res = await fetch('/api/eggs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'deleteAudit' })
      });

      if (res.ok) {
        refreshData();
        toast.success('Audit record deleted.');
      } else {
        toast.error('Failed to delete audit');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Maturation Handlers
  const handleOpenEditMaturation = (log: MaturationLog) => {
    setEditMaturationId(log.id);
    setEditMaturationBirdId(log.birdId);
    setEditMaturationEggsCount(String(log.eggsCount));
    setEditMaturationWeight(String(log.avgWeightGrams));
    setEditMaturationNotes(log.notes);
    setOpenEditMaturation(true);
  };

  const handleCloseEditMaturation = () => {
    setOpenEditMaturation(false);
    setEditMaturationId(null);
    setEditMaturationBirdId('');
    setEditMaturationEggsCount('');
    setEditMaturationWeight('');
    setEditMaturationNotes('');
  };

  const handleUpdateMaturation = async () => {
    if (!editMaturationId || !editMaturationEggsCount || !editMaturationWeight) return;
    try {
      const res = await fetch('/api/eggs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateMaturation',
          id: editMaturationId,
          birdId: editMaturationBirdId,
          eggsCount: Number(editMaturationEggsCount),
          avgWeightGrams: Number(editMaturationWeight),
          notes: editMaturationNotes
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseEditMaturation();
        toast.success('Maturation record updated!');
      } else {
        toast.error('Failed to update maturation record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaturation = async (id: string) => {
    if (!window.confirm("Delete this maturation record?")) return;
    try {
      const res = await fetch('/api/eggs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'deleteMaturation' })
      });

      if (res.ok) {
        refreshData();
        toast.success('Maturation record deleted.');
      } else {
        toast.error('Failed to delete maturation record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEggs = filterByTimeRange(eggs);
  const totalGoodEggs = filteredEggs.reduce((sum, e) => sum + e.goodEggs, 0);
  const totalBrokenEggs = filteredEggs.reduce((sum, e) => sum + e.brokenEggs, 0);
  const totalSpoiltEggs = filteredEggs.reduce((sum, e) => sum + e.spoiltEggs, 0);
  const totalCollected = totalGoodEggs + totalBrokenEggs + totalSpoiltEggs;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{texts.eggs.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{texts.eggs.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => handleExportReports('csv')}
            className="bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={() => handleExportReports('pdf')}
            className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer size={16} /> Print Report
          </button>
          <button 
            onClick={handleOpenAudit}
            className="bg-white border-2 border-indigo-200 text-indigo-750 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            {texts.eggs.auditCushioning}
          </button>
          <button 
            onClick={handleOpenMaturation}
            className="bg-white border-2 border-indigo-200 text-indigo-750 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            {texts.eggs.logMaturation}
          </button>
          <button 
            onClick={handleOpenCollect}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> {texts.eggs.logCollection}
          </button>
        </div>
      </div>

      {/* Quality Loss Warning Alerts Banner */}
      {totalBrokenEggs > 0 && (
        <div className="border-2 border-red-500 bg-red-50 p-4 flex items-center gap-4">
          <AlertTriangle size={36} className="text-red-600 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-950 uppercase">🚨 Nesting Box Quality Loss Alert</p>
            <p className="text-xs text-red-800 mt-0.5">
              Quality control isolated <strong>{totalBrokenEggs} cracked/broken eggs</strong> during collection protocols. Audit laying box cushioning immediately to aggressively mitigate egg breakage rates.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{texts.eggs.totalCollected}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{totalCollected.toLocaleString()}</p>
              </div>
              <div className="text-indigo-650">
                <BarChart2 size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{texts.eggs.goodEggs}</p>
                <p className="text-3xl font-semibold text-emerald-650 mt-2">{totalGoodEggs.toLocaleString()}</p>
              </div>
              <div className="text-emerald-600">
                <BarChart2 size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{texts.eggs.brokenEggs}</p>
                <p className="text-3xl font-semibold text-red-650 mt-2">{totalBrokenEggs.toLocaleString()}</p>
              </div>
              <div className="text-red-500">
                <AlertTriangle size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{texts.eggs.spoiltEggs}</p>
                <p className="text-3xl font-semibold text-amber-600 mt-2">{totalSpoiltEggs.toLocaleString()}</p>
              </div>
              <div className="text-amber-500">
                <AlertTriangle size={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Cushioning Audits vs Maturation logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box Cushioning Audits */}
        <Card>
            <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <CheckSquare size={18} className="text-indigo-650" /> {texts.eggs.cushionAudits}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[11px] text-slate-500 mb-4">
              Regular checks of nesting box padding and straw status to aggressively decrease cracked shell incidences:
            </p>
            <TableControls searchTerm={cushionAuditsLogic.searchTerm} setSearchTerm={cushionAuditsLogic.setSearchTerm} placeholder="Search audits..." />
            <div className="overflow-x-auto overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label={texts.common.date} sortKey="date" currentSort={cushionAuditsLogic.sortConfig} onSort={cushionAuditsLogic.handleSort} />
                    <TableSortHeader label="Nesting Box" sortKey="boxName" currentSort={cushionAuditsLogic.sortConfig} onSort={cushionAuditsLogic.handleSort} />
                    <TableSortHeader label={texts.common.status} sortKey="status" currentSort={cushionAuditsLogic.sortConfig} onSort={cushionAuditsLogic.handleSort} />
                    <TableSortHeader label="Action Completed" sortKey="actionTaken" currentSort={cushionAuditsLogic.sortConfig} onSort={cushionAuditsLogic.handleSort} />
                    {canEdit && <th className="px-4 py-3">{texts.common.actions}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {cushionAuditsLogic.data.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">{log.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.boxName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase ${
                          log.status.includes('Optimal') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 animate-pulse'
                        }`}>{log.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-650 font-medium">{log.actionTaken}</td>
                      {canEdit && (
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleOpenEditAudit(log)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteAudit(log.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
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
            <TablePagination 
              currentPage={cushionAuditsLogic.currentPage}
              totalPages={cushionAuditsLogic.totalPages}
              totalItems={cushionAuditsLogic.totalItems}
              pageSize={cushionAuditsLogic.pageSize}
              onPageChange={cushionAuditsLogic.setCurrentPage}
              onPageSizeChange={cushionAuditsLogic.setPageSize}
            />
          </CardContent>
        </Card>

        {/* Newly Laying Maturation Logs */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-650" /> {texts.eggs.maturationLogs}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[11px] text-slate-500 mb-4">
              Maturation metrics for the 3 newly laying birds to track structural weight bounds and size progressions:
            </p>
            <TableControls searchTerm={maturationLogsLogic.searchTerm} setSearchTerm={maturationLogsLogic.setSearchTerm} placeholder="Search metrics..." />
            <div className="overflow-x-auto overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label={texts.common.date} sortKey="date" currentSort={maturationLogsLogic.sortConfig} onSort={maturationLogsLogic.handleSort} />
                    <TableSortHeader label="Bird ID" sortKey="birdId" currentSort={maturationLogsLogic.sortConfig} onSort={maturationLogsLogic.handleSort} />
                    <TableSortHeader label="Eggs Count" sortKey="eggsCount" currentSort={maturationLogsLogic.sortConfig} onSort={maturationLogsLogic.handleSort} />
                    <TableSortHeader label="Avg Egg Weight (g)" sortKey="avgWeightGrams" currentSort={maturationLogsLogic.sortConfig} onSort={maturationLogsLogic.handleSort} />
                    <TableSortHeader label={texts.common.notes} sortKey="notes" currentSort={maturationLogsLogic.sortConfig} onSort={maturationLogsLogic.handleSort} />
                    {canEdit && <th className="px-4 py-3">{texts.common.actions}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {maturationLogsLogic.data.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">{log.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.birdId}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{log.eggsCount} egg</td>
                      <td className="px-4 py-3 text-amber-605 font-semibold">{log.avgWeightGrams} g</td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{log.notes}</td>
                      {canEdit && (
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleOpenEditMaturation(log)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaturation(log.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
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
            <TablePagination 
              currentPage={maturationLogsLogic.currentPage}
              totalPages={maturationLogsLogic.totalPages}
              totalItems={maturationLogsLogic.totalItems}
              pageSize={maturationLogsLogic.pageSize}
              onPageChange={maturationLogsLogic.setCurrentPage}
              onPageSizeChange={maturationLogsLogic.setPageSize}
            />
          </CardContent>
        </Card>
      </div>

      {/* Collection Logs */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
            {texts.eggs.collectionLogs}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableControls searchTerm={eggsLogic.searchTerm} setSearchTerm={eggsLogic.setSearchTerm} placeholder="Search collections..." />
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableSortHeader label={texts.common.date} sortKey="date" currentSort={eggsLogic.sortConfig} onSort={eggsLogic.handleSort} />
                  <TableSortHeader label="Batch ID" sortKey="batchId" currentSort={eggsLogic.sortConfig} onSort={eggsLogic.handleSort} />
                  <TableSortHeader label="Good Eggs" sortKey="goodEggs" currentSort={eggsLogic.sortConfig} onSort={eggsLogic.handleSort} />
                  <TableSortHeader label="Broken / Cracked" sortKey="brokenEggs" currentSort={eggsLogic.sortConfig} onSort={eggsLogic.handleSort} />
                  <TableSortHeader label="Spoilt" sortKey="spoiltEggs" currentSort={eggsLogic.sortConfig} onSort={eggsLogic.handleSort} />
                  {canEdit && <th className="px-4 py-3">{texts.common.actions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eggsLogic.data.map((egg) => (
                  <tr key={egg.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-950">{egg.date}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{egg.batchId}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{egg.goodEggs}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{egg.brokenEggs}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600">{egg.spoiltEggs}</td>
                    {canEdit && (
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => handleOpenEditCollection(egg)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(egg.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination 
            currentPage={eggsLogic.currentPage}
            totalPages={eggsLogic.totalPages}
            totalItems={eggsLogic.totalItems}
            pageSize={eggsLogic.pageSize}
            onPageChange={eggsLogic.setCurrentPage}
            onPageSizeChange={eggsLogic.setPageSize}
          />
        </CardContent>
      </Card>

      {/* Log Collection Modal */}
      <Dialog open={openCollect} onClose={handleCloseCollect} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Log Egg Collection</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Collection Date"
            type="date"
            fullWidth
            variant="outlined"
            value={collectDate}
            onChange={(e) => setCollectDate(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } }, inputLabel: { shrink: true } }}
          />
          <SelectWithAdd
            label="Chicken Batch"
            value={collectBatchId}
            onChange={setCollectBatchId}
            items={batches.map(b => ({ id: b.id, label: `${b.id} (${b.breed} - ${b.type})` }))}
            addPath="/chickens"
          />
          <TextField
            label="Good Eggs Count"
            type="number"
            fullWidth
            variant="outlined"
            value={goodEggs}
            onChange={(e) => setGoodEggs(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Cracked / Broken Eggs"
            type="number"
            fullWidth
            variant="outlined"
            value={brokenEggs}
            onChange={(e) => setBrokenEggs(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Spoilt Eggs Count"
            type="number"
            fullWidth
            variant="outlined"
            value={spoiltEggs}
            onChange={(e) => setSpoiltEggs(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseCollect} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleCollect} 
            variant="contained" 
            disabled={!goodEggs}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Log Collection
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Cushioning Audit Modal */}
      <Dialog open={openAudit} onClose={handleCloseAudit} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Record Nesting Box Cushion Audit</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Nesting Box</InputLabel>
            <Select
              value={auditBox}
              onChange={(e) => setAuditBox(e.target.value)}
              label="Nesting Box"
              className="rounded-sm"
            >
              <MenuItem value="Box #1">Box #1</MenuItem>
              <MenuItem value="Box #2">Box #2</MenuItem>
              <MenuItem value="Box #3">Box #3</MenuItem>
              <MenuItem value="Box #4">Box #4</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Cushion Condition</InputLabel>
            <Select
              value={auditCondition}
              onChange={(e) => setAuditCondition(e.target.value)}
              label="Cushion Condition"
              className="rounded-sm"
            >
              <MenuItem value="Optimal Cushioning">Optimal Cushioning</MenuItem>
              <MenuItem value="Compressed - Low Straw">Compressed - Low Straw (Requires Replenishing)</MenuItem>
              <MenuItem value="Missing Padding">Missing Padding (Critical Quality Threat)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Specific Action Taken / Notes"
            fullWidth
            variant="outlined"
            placeholder="e.g. Refilled straw cushioning & realigned nest box padding"
            value={auditActionTaken}
            onChange={(e) => setAuditActionTaken(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseAudit} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleLogAudit} 
            variant="contained" 
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Register Audit
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Maturation Log Modal */}
      <Dialog open={openMaturation} onClose={handleCloseMaturation} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Log Newly Laying Maturation Metric</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Newly Laying Bird ID</InputLabel>
            <Select
              value={maturationBirdId}
              onChange={(e) => setMaturationBirdId(e.target.value)}
              label="Newly Laying Bird ID"
              className="rounded-sm"
            >
              <MenuItem value="Bird-NL01">Bird-NL01 (Isa Brown newly laying)</MenuItem>
              <MenuItem value="Bird-NL02">Bird-NL02 (Isa Brown newly laying)</MenuItem>
              <MenuItem value="Bird-NL03">Bird-NL03 (Isa Brown newly laying)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Eggs Count (Yield)"
            type="number"
            fullWidth
            variant="outlined"
            placeholder="e.g. 1"
            value={maturationEggsCount}
            onChange={(e) => setMaturationEggsCount(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Avg Egg Weight (in grams)"
            type="number"
            fullWidth
            variant="outlined"
            placeholder="e.g. 51.5"
            value={maturationWeight}
            onChange={(e) => setMaturationWeight(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Laying Shell / Shape Notes"
            fullWidth
            variant="outlined"
            placeholder="e.g. Shell thickness thin but improving"
            value={maturationNotes}
            onChange={(e) => setMaturationNotes(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseMaturation} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleLogMaturation} 
            variant="contained" 
            disabled={!maturationEggsCount || !maturationWeight}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Log Metric
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Edit Collection Modal */}
      <Dialog open={openEditCollection} onClose={handleCloseEditCollection} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Edit Egg Collection</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Good Eggs Count"
            type="number"
            fullWidth
            variant="outlined"
            value={editGoodEggs}
            onChange={(e) => setEditGoodEggs(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Broken / Cracked Eggs Count"
            type="number"
            fullWidth
            variant="outlined"
            value={editBrokenEggs}
            onChange={(e) => setEditBrokenEggs(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Spoilt Eggs Count"
            type="number"
            fullWidth
            variant="outlined"
            value={editSpoiltEggs}
            onChange={(e) => setEditSpoiltEggs(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseEditCollection} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleUpdateCollection} 
            variant="contained" 
            disabled={!editGoodEggs}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Update Collection
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Edit Audit Modal */}
      <Dialog open={openEditAudit} onClose={handleCloseEditAudit} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Edit Cushioning Audit</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Nesting Box</InputLabel>
            <Select
              value={editAuditBox}
              onChange={(e) => setEditAuditBox(e.target.value)}
              label="Nesting Box"
              className="rounded-sm"
            >
              <MenuItem value="Box #1">Box #1</MenuItem>
              <MenuItem value="Box #2">Box #2</MenuItem>
              <MenuItem value="Box #3">Box #3</MenuItem>
              <MenuItem value="Box #4">Box #4</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Cushion Condition</InputLabel>
            <Select
              value={editAuditCondition}
              onChange={(e) => setEditAuditCondition(e.target.value)}
              label="Cushion Condition"
              className="rounded-sm"
            >
              <MenuItem value="Optimal Cushioning">Optimal Cushioning</MenuItem>
              <MenuItem value="Compressed - Low Straw">Compressed - Low Straw (Requires Replenishing)</MenuItem>
              <MenuItem value="Missing Padding">Missing Padding (Critical Quality Threat)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Specific Action Taken / Notes"
            fullWidth
            variant="outlined"
            placeholder="e.g. Refilled straw cushioning & realigned nest box padding"
            value={editAuditActionTaken}
            onChange={(e) => setEditAuditActionTaken(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseEditAudit} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleUpdateAudit} 
            variant="contained" 
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Update Audit
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Edit Maturation Modal */}
      <Dialog open={openEditMaturation} onClose={handleCloseEditMaturation} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Edit Maturation Record</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Newly Laying Bird ID</InputLabel>
            <Select
              value={editMaturationBirdId}
              onChange={(e) => setEditMaturationBirdId(e.target.value)}
              label="Newly Laying Bird ID"
              className="rounded-sm"
            >
              <MenuItem value="Bird-NL01">Bird-NL01 (Isa Brown newly laying)</MenuItem>
              <MenuItem value="Bird-NL02">Bird-NL02 (Isa Brown newly laying)</MenuItem>
              <MenuItem value="Bird-NL03">Bird-NL03 (Isa Brown newly laying)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Eggs Count (Yield)"
            type="number"
            fullWidth
            variant="outlined"
            value={editMaturationEggsCount}
            onChange={(e) => setEditMaturationEggsCount(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Avg Egg Weight (grams)"
            type="number"
            fullWidth
            variant="outlined"
            value={editMaturationWeight}
            onChange={(e) => setEditMaturationWeight(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Maturation Notes"
            fullWidth
            variant="outlined"
            placeholder="e.g. Shell thickness thin but improving"
            value={editMaturationNotes}
            onChange={(e) => setEditMaturationNotes(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseEditMaturation} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleUpdateMaturation} 
            variant="contained" 
            disabled={!editMaturationEggsCount || !editMaturationWeight}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Update Record
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
