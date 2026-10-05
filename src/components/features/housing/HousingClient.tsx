'use strict';
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Home, Edit2, Trash2, Thermometer, History, Droplets, Calendar, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { FarmPen, ChickenBatch, TemperatureLog } from "@/data/types";
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import { useLanguage } from '../LanguageContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Select, MenuItem, FormControl, InputLabel, Button as MuiButton 
} from '@mui/material';

/**
 * HousingClient component for managing farm housing and pens.
 * @param props The component props.
 * @param props.role The user role.
 */
export function HousingClient({ role }: { role: string }) {
  const { texts, t, formatNumber } = useLanguage();
  const { confirm } = useConfirm();
  const [pens, setPens] = useState<FarmPen[]>([]);
  const [batches, setBatches] = useState<ChickenBatch[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPen, setEditingPen] = useState<FarmPen | null>(null);
  const canEdit = role === 'Admin' || role === 'Manager';
  const [formData, setFormData] = useState({
    name: '',
    capacity: 1000,
    status: 'Active',
    currentBatchId: ''
  });

  // Temperature logging state
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPenForHistory, setSelectedPenForHistory] = useState<FarmPen | null>(null);
  const [submittingTemp, setSubmittingTemp] = useState(false);
  const [tempForm, setTempForm] = useState({
    penId: '',
    tempCelsius: '',
    humidity: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: '',
    recordedBy: ''
  });

  const pensLogic = useTableLogic({
    data: pens,
    searchFields: ['name', 'currentBatchId', 'status'],
    initialPageSize: 20
  });

  const refreshData = async () => {
    try {
      const res = await fetch('/api/housing');
      if (res.ok) {
        const data = await res.json();
        const loadedPens: FarmPen[] = data.farmPens || [];
        setPens(loadedPens);
        setBatches(data.batches || []);

        // Also update selectedPenForHistory if opened
        if (selectedPenForHistory) {
          const fresh = loadedPens.find(p => p.id === selectedPenForHistory.id);
          if (fresh) setSelectedPenForHistory(fresh);
        }
      }
    } catch {}
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!await confirm(t('Delete this pen?'))) return;
    try {
      const res = await fetch(`/api/housing?id=${id}`, { method: 'DELETE' });
      if (res.ok) { 
        setPens(prev => prev.filter(p => p.id !== id));
        refreshData(); 
        toast.success(t('Pen deleted.')); 
      }
      else toast.error(t('Failed to delete pen'));
    } catch {}
  };

  const handleEdit = (pen: FarmPen) => {
    setEditingPen(pen);
    setFormData({ name: pen.name, capacity: pen.capacity, status: pen.status, currentBatchId: pen.currentBatchId || '' });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = editingPen ? 'PUT' : 'POST';
      const body = editingPen
        ? { id: editingPen.id, ...formData, currentBatchId: formData.currentBatchId === '' ? null : formData.currentBatchId }
        : { ...formData, currentBatchId: formData.currentBatchId === '' ? null : formData.currentBatchId };
      const res = await fetch('/api/housing', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const saved = await res.json();
        if (editingPen) {
          setPens(prev => prev.map(p => p.id === editingPen.id ? { ...p, ...formData, capacity: Number(formData.capacity) } : p));
        } else if (saved && saved.id) {
          setPens(prev => [saved, ...prev]);
        }
        refreshData();
        setOpen(false);
        setEditingPen(null);
        setFormData({ name: '', capacity: 1000, status: 'Active', currentBatchId: '' });
        toast.success(editingPen ? t('Pen updated!') : t('Pen added!'));
      } else {
        toast.error(t('Failed to save pen'));
      }
    } catch {}
  };

  const getLatestTempLog = (pen: FarmPen): TemperatureLog | null => {
    if (!pen.temperatureLogs || !Array.isArray(pen.temperatureLogs) || pen.temperatureLogs.length === 0) {
      return null;
    }
    return pen.temperatureLogs[0];
  };

  const getTempStatus = (temp: number) => {
    if (temp >= 18 && temp <= 26) {
      return { label: 'Optimal', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (temp > 26 && temp <= 30) {
      return { label: 'Warm', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (temp > 30) {
      return { label: 'Heat Stress', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    return { label: 'Chilling', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  };

  const handleOpenTempModal = (pen?: FarmPen) => {
    const now = new Date();
    setTempForm({
      penId: pen ? pen.id : (pens[0]?.id || ''),
      tempCelsius: '',
      humidity: '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      notes: '',
      recordedBy: ''
    });
    setTempModalOpen(true);
  };

  const handleOpenHistoryModal = (pen: FarmPen) => {
    setSelectedPenForHistory(pen);
    setHistoryModalOpen(true);
  };

  const handleSaveTemperature = async () => {
    if (!tempForm.penId) {
      toast.error(t('Please select a pen.'));
      return;
    }
    const tempNum = parseFloat(String(tempForm.tempCelsius));
    if (isNaN(tempNum)) {
      toast.error(t('Please enter a valid temperature.'));
      return;
    }

    setSubmittingTemp(true);
    try {
      const res = await fetch('/api/housing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logTemperature',
          penId: tempForm.penId,
          tempCelsius: tempNum,
          humidity: tempForm.humidity !== '' ? parseFloat(String(tempForm.humidity)) : null,
          date: tempForm.date,
          time: tempForm.time,
          notes: tempForm.notes,
          recordedBy: tempForm.recordedBy || 'Staff'
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(t('Temperature logged successfully!'));
        if (tempNum > 30 || tempNum < 18) {
          toast(tempNum > 30 
            ? t('High temperature (>30°C): Heat stress alert and regulation task created.') 
            : t('Low temperature (<18°C): Chilling risk alert and regulation task created.'), 
            { icon: '⚠️' }
          );
        }
        setTempModalOpen(false);
        refreshData();
        if (selectedPenForHistory && selectedPenForHistory.id === tempForm.penId && data.pen) {
          setSelectedPenForHistory(data.pen);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || t('Failed to log temperature.'));
      }
    } catch {
      toast.error(t('Failed to log temperature.'));
    } finally {
      setSubmittingTemp(false);
    }
  };

  // Compute history statistics for selected pen
  const historyLogs: TemperatureLog[] = (selectedPenForHistory?.temperatureLogs as TemperatureLog[]) || [];
  const validTemps = historyLogs.map(l => Number(l.tempCelsius)).filter(n => !isNaN(n));
  const avgTemp = validTemps.length > 0 ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1) : null;
  const minTemp = validTemps.length > 0 ? Math.min(...validTemps).toFixed(1) : null;
  const maxTemp = validTemps.length > 0 ? Math.max(...validTemps).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t("Housing & Pens")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("Manage farm housing, capacities, environmental conditions, and batch assignments.")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenTempModal()}
            className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm shadow-amber-600/20 active:scale-95"
          >
            <Thermometer size={18} /> {t("Log Temperature")}
          </button>
          {role !== 'Staff' && (
            <button 
              onClick={() => setOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={18} /> {t("Add Pen")}
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 flex justify-between items-center flex-row">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Home size={18} className="text-indigo-600" /> {t("Farm pens")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100">
            <TableControls searchTerm={pensLogic.searchTerm} setSearchTerm={pensLogic.setSearchTerm} placeholder={t("Search pens...")} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableSortHeader label={t("Pen Name")} sortKey="name" currentSort={pensLogic.sortConfig} onSort={pensLogic.handleSort} />
                  <TableSortHeader label={t("Capacity")} sortKey="capacity" currentSort={pensLogic.sortConfig} onSort={pensLogic.handleSort} />
                  <TableSortHeader label={t("Current Batch")} sortKey="currentBatchId" currentSort={pensLogic.sortConfig} onSort={pensLogic.handleSort} />
                  <TableSortHeader label={t("Status")} sortKey="status" currentSort={pensLogic.sortConfig} onSort={pensLogic.handleSort} />
                  <th className="px-4 py-3 text-slate-500 font-semibold">{t("Temperature (°C)")}</th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pensLogic.data.map(p => {
                  const latest = getLatestTempLog(p);
                  const tempStatus = latest ? getTempStatus(latest.tempCelsius) : null;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600">{formatNumber(p.capacity)} {t("birds")}</td>
                      <td className="px-4 py-3 text-slate-600">{p.currentBatchId || t('Empty')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Cleaning' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                          {t(p.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        {latest && tempStatus ? (
                          <button
                            onClick={() => handleOpenHistoryModal(p)}
                            className="flex items-center gap-1.5 group text-left hover:opacity-80 transition-opacity"
                            title={t("View temperature history")}
                          >
                            <span className="font-semibold text-slate-900 text-xs font-mono">
                              {latest.tempCelsius}°C
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tempStatus.color}`}>
                              {t(tempStatus.label)}
                            </span>
                            {latest.humidity != null && (
                              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                {latest.humidity}% RH
                              </span>
                            )}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenTempModal(p)}
                            className="text-slate-400 hover:text-amber-600 text-[11px] italic flex items-center gap-1 transition-colors"
                            title={t("Click to log temperature")}
                          >
                            <Thermometer size={12} /> {t("No readings")}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenTempModal(p)} 
                          className="p-1 hover:bg-amber-100 rounded transition-colors text-amber-600" 
                          title={t("Log Temperature")}
                        >
                          <Thermometer size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenHistoryModal(p)} 
                          className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-600" 
                          title={t("Temperature History")}
                        >
                          <History size={14} />
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => handleEdit(p)} className="p-1 hover:bg-blue-100 rounded transition-colors" title={t("Edit")}><Edit2 size={14} className="text-blue-600" /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-100 rounded transition-colors" title={t("Delete")}><Trash2 size={14} className="text-red-600" /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {pens.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-slate-500 font-sans">{t("No farm pens recorded.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100">
            <TablePagination 
              currentPage={pensLogic.currentPage}
              totalPages={pensLogic.totalPages}
              totalItems={pensLogic.totalItems}
              pageSize={pensLogic.pageSize}
              onPageChange={pensLogic.setCurrentPage}
              onPageSizeChange={pensLogic.setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Pen Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); setEditingPen(null); setFormData({ name: '', capacity: 1000, status: 'Active', currentBatchId: '' }); }} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 600, color: '#0f172a' }}>{editingPen ? t('Edit farm pen') : t('Add farm pen')}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label={t("Pen Name")}
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder={t("e.g. Broiler Pen A")}
          />
          <TextField
            label={t("Capacity (Birds)")}
            type="number"
            fullWidth
            variant="outlined"
            value={formData.capacity}
            onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>{t("Status")}</InputLabel>
            <Select
              value={formData.status}
              label={t("Status")}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="rounded-sm"
            >
              <MenuItem value="Active">{t("Active")}</MenuItem>
              <MenuItem value="Cleaning">{t("Cleaning")}</MenuItem>
              <MenuItem value="Empty">{t("Empty")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>{t("Assign Batch (Optional)")}</InputLabel>
            <Select
              value={formData.currentBatchId}
              label={t("Assign Batch (Optional)")}
              onChange={e => setFormData({ ...formData, currentBatchId: e.target.value })}
              className="rounded-sm"
            >
              <MenuItem value=""><em>{t("None")}</em></MenuItem>
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.breed} ({b.id}) - {b.quantity} birds</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => { setOpen(false); setEditingPen(null); }} sx={{ color: '#64748b', borderRadius: 2 }}>{t("Cancel")}</MuiButton>
          <MuiButton onClick={handleSave} variant="contained" disabled={!formData.name} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}>{editingPen ? t('Save Changes') : t('Add Pen')}</MuiButton>
        </DialogActions>
      </Dialog>

      {/* Log Temperature Dialog */}
      <Dialog 
        open={tempModalOpen} 
        onClose={() => setTempModalOpen(false)} 
        fullWidth 
        maxWidth="sm" 
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Thermometer className="text-amber-600" size={20} />
          {t("Log Pen Temperature")}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-1" />
          
          <FormControl fullWidth variant="outlined">
            <InputLabel>{t("Select Farm Pen")}</InputLabel>
            <Select
              value={tempForm.penId}
              label={t("Select Farm Pen")}
              onChange={e => setTempForm({ ...tempForm, penId: e.target.value })}
              className="rounded-sm"
            >
              {pens.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.currentBatchId ? `(Batch: ${p.currentBatchId})` : `(${p.status})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label={t("Temperature (°C)")}
              type="number"
              slotProps={{ htmlInput: { step: "0.1" } }}
              fullWidth
              variant="outlined"
              placeholder="e.g. 23.5"
              value={tempForm.tempCelsius}
              onChange={e => setTempForm({ ...tempForm, tempCelsius: e.target.value })}
              required
            />
            <TextField
              label={t("Humidity (% RH - Optional)")}
              type="number"
              slotProps={{ htmlInput: { step: "1", min: "0", max: "100" } }}
              fullWidth
              variant="outlined"
              placeholder="e.g. 60"
              value={tempForm.humidity}
              onChange={e => setTempForm({ ...tempForm, humidity: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label={t("Date")}
              type="date"
              fullWidth
              variant="outlined"
              value={tempForm.date}
              onChange={e => setTempForm({ ...tempForm, date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t("Time")}
              type="time"
              fullWidth
              variant="outlined"
              value={tempForm.time}
              onChange={e => setTempForm({ ...tempForm, time: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </div>

          <TextField
            label={t("Notes / Observations (Optional)")}
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            placeholder={t("e.g. Ventilation fans active, birds active and well-hydrated")}
            value={tempForm.notes}
            onChange={e => setTempForm({ ...tempForm, notes: e.target.value })}
          />

          {/* Quick guide box */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Thermometer size={14} className="text-amber-600" />
              {t("Poultry Housing Temperature Guidelines:")}
            </p>
            <p className="text-[11px] text-amber-700">
              • <strong>18°C – 26°C:</strong> Optimal comfort & feed conversion.<br/>
              • <strong>27°C – 30°C:</strong> Warm; ensure proper ventilation & fresh water.<br/>
              • <strong>&gt; 30°C:</strong> Heat stress risk — automatically creates alert & regulation task.<br/>
              • <strong>&lt; 18°C:</strong> Chilling risk — automatically logs temperature alert.
            </p>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setTempModalOpen(false)} sx={{ color: '#64748b', borderRadius: 2 }}>
            {t("Cancel")}
          </MuiButton>
          <MuiButton 
            onClick={handleSaveTemperature} 
            variant="contained" 
            disabled={!tempForm.penId || tempForm.tempCelsius === '' || submittingTemp} 
            sx={{ bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' }, borderRadius: 2, boxShadow: 'none' }}
          >
            {submittingTemp ? t('Saving...') : t('Save Reading')}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Temperature History Dialog */}
      <Dialog 
        open={historyModalOpen} 
        onClose={() => { setHistoryModalOpen(false); setSelectedPenForHistory(null); }} 
        fullWidth 
        maxWidth="md" 
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2">
            <History className="text-slate-700" size={20} />
            <div>
              <span>{selectedPenForHistory?.name} - {t("Temperature Log History")}</span>
              <p className="text-xs font-normal text-slate-500 mt-0.5">
                {t("Batch:")} {selectedPenForHistory?.currentBatchId || t('None')} | {t("Capacity:")} {formatNumber(selectedPenForHistory?.capacity || 0)} {t("birds")}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedPenForHistory) handleOpenTempModal(selectedPenForHistory);
            }}
            className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Thermometer size={14} /> {t("Log New")}
          </button>
        </DialogTitle>
        <DialogContent className="pt-2">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase">{t("Latest Temp")}</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {historyLogs.length > 0 ? `${historyLogs[0].tempCelsius}°C` : '—'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase">{t("Average Temp")}</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {avgTemp ? `${avgTemp}°C` : '—'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-medium text-slate-500 uppercase">{t("Total Readings")}</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {historyLogs.length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold text-slate-600">{t("Date & Time")}</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600">{t("Temperature")}</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600">{t("Humidity")}</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600">{t("Status")}</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600">{t("Notes")}</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600">{t("Logged By")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {historyLogs.map(log => {
                    const status = getTempStatus(Number(log.tempCelsius));
                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">
                          {log.date} {log.time ? <span className="text-slate-400 text-[10px]">({log.time})</span> : null}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {log.tempCelsius}°C
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {log.humidity != null ? `${log.humidity}%` : '—'}
                        </td>
                        <td className="px-3 py-2 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}>
                            {t(status.label)}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-600 max-w-[200px] truncate" title={log.notes || ''}>
                          {log.notes || '—'}
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-500">
                          {log.recordedBy || 'Staff'}
                        </td>
                      </tr>
                    );
                  })}
                  {historyLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500 font-sans">
                        <Thermometer size={24} className="mx-auto text-slate-300 mb-2" />
                        <p>{t("No temperature readings recorded for this pen yet.")}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => { setHistoryModalOpen(false); setSelectedPenForHistory(null); }} sx={{ color: '#64748b', borderRadius: 2 }}>
            {t("Close")}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
