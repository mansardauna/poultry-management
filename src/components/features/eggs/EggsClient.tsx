'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { Plus, BarChart2, AlertTriangle, CheckSquare, Edit2, Trash2 } from 'lucide-react';
import { TEXTS } from "@/lib/constants/texts";
import { EggRecord, ChickenBatch, CushionAudit, MaturationLog } from "@/data/types";
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

interface EggsClientProps {
  initialEggs: EggRecord[];
  batches: ChickenBatch[];
  initialCushionAudits: CushionAudit[];
  initialMaturationLogs: MaturationLog[];
  role: string;
}

export function EggsClient({ initialEggs, batches, initialCushionAudits, initialMaturationLogs, role }: EggsClientProps) {
  const [eggs, setEggs] = useState<EggRecord[]>(initialEggs);
  const canEdit = role === 'Admin' || role === 'Manager';
  const [cushionAudits, setCushionAudits] = useState<CushionAudit[]>(initialCushionAudits);
  const [maturationLogs, setMaturationLogs] = useState<MaturationLog[]>(initialMaturationLogs);
  
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
  }, []);

  const handleOpenCollect = () => setOpenCollect(true);
  const handleCloseCollect = () => {
    setOpenCollect(false);
    setCollectBatchId(batches[0]?.id || 'b1');
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

  const totalGoodEggs = eggs.reduce((sum, e) => sum + e.goodEggs, 0);
  const totalBrokenEggs = eggs.reduce((sum, e) => sum + e.brokenEggs, 0);
  const totalSpoiltEggs = eggs.reduce((sum, e) => sum + e.spoiltEggs, 0);
  const totalCollected = totalGoodEggs + totalBrokenEggs + totalSpoiltEggs;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{TEXTS.eggs.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{TEXTS.eggs.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenAudit}
            className="bg-white border-2 border-indigo-200 text-indigo-750 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            Audit Cushioning
          </button>
          <button 
            onClick={handleOpenMaturation}
            className="bg-white border-2 border-indigo-200 text-indigo-750 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            Log Maturation
          </button>
          <button 
            onClick={handleOpenCollect}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> {TEXTS.eggs.logCollection}
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{TEXTS.eggs.totalCollected}</p>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{TEXTS.eggs.goodEggs}</p>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{TEXTS.eggs.brokenEggs}</p>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{TEXTS.eggs.spoiltEggs}</p>
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
              <CheckSquare size={18} className="text-indigo-650" /> Nesting Box Cushioning Audits (Database Log)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[11px] text-slate-500 mb-4">
              Regular checks of nesting box padding and straw status to aggressively decrease cracked shell incidences:
            </p>
            <div className="overflow-x-auto overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Nesting Box</th>
                    <th className="px-4 py-3">Cushioning Status</th>
                    <th className="px-4 py-3">Action Completed</th>
                    {canEdit && <th className="px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {cushionAudits.map((log) => (
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
          </CardContent>
        </Card>

        {/* Newly Laying Maturation Logs */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-650" /> Newly Laying Birds Maturation Logs (Database Log)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[11px] text-slate-500 mb-4">
              Maturation metrics for the 3 newly laying birds to track structural weight bounds and size progressions:
            </p>
            <div className="overflow-x-auto overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Bird ID</th>
                    <th className="px-4 py-3">Eggs Count</th>
                    <th className="px-4 py-3">Avg Egg Weight (g)</th>
                    <th className="px-4 py-3">Notes</th>
                    {canEdit && <th className="px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {maturationLogs.map((log) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Collection Logs */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
            {TEXTS.eggs.collectionLogs}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Batch ID</th>
                  <th className="px-4 py-3">Good Eggs</th>
                  <th className="px-4 py-3">Broken / Cracked</th>
                  <th className="px-4 py-3">Spoilt</th>
                  {canEdit && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eggs.map((egg) => (
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
        </CardContent>
      </Card>

      {/* Log Collection Modal */}
      <Dialog open={openCollect} onClose={handleCloseCollect} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Log Egg Collection</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
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
              style={{ borderRadius: 2 }}
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
              style={{ borderRadius: 2 }}
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
              style={{ borderRadius: 2 }}
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
              style={{ borderRadius: 2 }}
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
              style={{ borderRadius: 2 }}
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
              style={{ borderRadius: 2 }}
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
