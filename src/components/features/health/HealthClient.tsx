'use strict';
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Calendar, Settings, CheckCircle, Clock, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { DatabaseSchema, MedicationTemplate, MedicationSchedule, ChickenBatch } from "@/data/types";
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import { useLanguage } from '../LanguageContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
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
 * HealthClient component for managing flock health and vaccinations.
 * @param props The component props.
 * @param props.role The user role.
 */
export function HealthClient({ role }: { role: string }) {
  const { texts, t, formatNumber } = useLanguage();
  const { confirm } = useConfirm();
  const [templates, setTemplates] = useState<MedicationTemplate[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [batches, setBatches] = useState<ChickenBatch[]>([]);
  const canEdit = role === 'Admin' || role === 'Manager';

  // Log Health Event State
  const [openLogHealth, setOpenLogHealth] = useState(false);
  const [logBatchId, setLogBatchId] = useState('');
  const [logMedicationName, setLogMedicationName] = useState('');
  const [logType, setLogType] = useState<'Vaccine' | 'Medication' | 'Supplement'>('Vaccine');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Dialog states
  const [openTemplate, setOpenTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [targetType, setTargetType] = useState('Broilers');
  const [stages, setStages] = useState([{ dayOffset: 1, medicationName: '', type: 'Vaccine' }]);

  // Apply Template State
  const [openApply, setOpenApply] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const schedulesLogic = useTableLogic({
    data: schedules,
    searchFields: ['scheduledDate', 'batchId', 'medicationName', 'type', 'status'],
    initialPageSize: 20
  });

  const refreshData = async () => {
    try {
      const res = await fetch('/api/all');
      if (res.ok) {
        const data = await res.json() as DatabaseSchema;
        setTemplates(data.medicationTemplates || []);
        setSchedules(data.medicationSchedules || []);
        setBatches(data.batches || []);
      }
    } catch {}
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogHealth = async () => {
    if (!logBatchId || !logMedicationName.trim()) return;
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addSchedule',
          batchId: logBatchId,
          medicationName: logMedicationName.trim(),
          type: logType,
          scheduledDate: logDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.schedule) {
          setSchedules(prev => [data.schedule, ...prev]);
        }
        refreshData();
        setOpenLogHealth(false);
        setLogMedicationName('');
        toast.success(t('Health event logged!'));
      } else {
        toast.error(t('Failed to log health event'));
      }
    } catch {
      toast.error(t('Network error'));
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addTemplate',
          name: templateName,
          targetType,
          stages
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.template) {
          setTemplates(prev => [data.template, ...prev]);
        }
        refreshData();
        setOpenTemplate(false);
        setTemplateName('');
        setStages([{ dayOffset: 1, medicationName: '', type: 'Vaccine' }]);
        toast.success('Template saved!');
      } else {
        toast.error('Failed to save template');
      }
    } catch {}
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !selectedBatchId) return;
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'applyTemplate',
          templateId: selectedTemplateId,
          batchId: selectedBatchId,
          startDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.schedules && Array.isArray(data.schedules)) {
          setSchedules(prev => [...data.schedules, ...prev]);
        }
        refreshData();
        setOpenApply(false);
        setSelectedTemplateId('');
        setSelectedBatchId('');
        toast.success('Template applied!');
      } else {
        toast.error('Failed to apply template');
      }
    } catch {}
  };

  const handleCompleteSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeSchedule', id })
      });
      if (res.ok) {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'Completed' } : s));
        refreshData();
        toast.success('Schedule completed!');
      } else {
        toast.error('Failed to complete schedule');
      }
    } catch {}
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!await confirm(t('Delete this schedule entry?', 'Delete this schedule entry?'))) return;
    try {
      const res = await fetch(`/api/health?id=${id}&type=schedule`, { method: 'DELETE' });
      if (res.ok) { 
        setSchedules(prev => prev.filter(s => s.id !== id));
        refreshData(); 
        toast.success('Schedule deleted.'); 
      }
      else toast.error('Failed to delete');
    } catch {}
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!await confirm(t('Delete this template? All linked schedules will remain.', 'Delete this template? All linked schedules will remain.'))) return;
    try {
      const res = await fetch(`/api/health?id=${id}&type=template`, { method: 'DELETE' });
      if (res.ok) { 
        setTemplates(prev => prev.filter(t => t.id !== id));
        refreshData(); 
        toast.success('Template deleted.'); 
      }
      else toast.error('Failed to delete');
    } catch {}
  };

  const addStageRow = () => {
    setStages([...stages, { dayOffset: stages.length + 1, medicationName: '', type: 'Vaccine' }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{texts.health?.title || t("Health & Medication")}</h1>
          <p className="text-sm text-slate-500 mt-1">{texts.health?.subtitle || t("Vaccination schedules, medication logs, and flock wellness.")}</p>
        </div>
        {role !== 'Staff' && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                setLogBatchId(batches[0]?.id || '');
                setLogMedicationName('');
                setLogType('Vaccine');
                setLogDate(new Date().toISOString().split('T')[0]);
                setOpenLogHealth(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={18} /> {t("Log Health Event")}
            </button>
            <button 
              onClick={() => setOpenApply(true)}
              className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Calendar size={17} /> {t("Apply Template")}
            </button>
            <button 
              onClick={() => setOpenTemplate(true)}
              className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Settings size={17} /> {t("Define Template")}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Schedules */}
        <Card>
          <CardHeader className="border-b border-slate-100 flex justify-between items-center flex-row">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" /> {t("Active Roster Calendar")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b border-slate-100">
              <TableControls searchTerm={schedulesLogic.searchTerm} setSearchTerm={schedulesLogic.setSearchTerm} placeholder={t("Search schedules...")} />
            </div>
            <div className="max-h-[400px] overflow-x-auto overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label={t("Date")} sortKey="scheduledDate" currentSort={schedulesLogic.sortConfig} onSort={schedulesLogic.handleSort} />
                    <TableSortHeader label={t("Batch")} sortKey="batchId" currentSort={schedulesLogic.sortConfig} onSort={schedulesLogic.handleSort} />
                    <TableSortHeader label={t("Medication")} sortKey="medicationName" currentSort={schedulesLogic.sortConfig} onSort={schedulesLogic.handleSort} />
                    <TableSortHeader label={t("Status")} sortKey="status" currentSort={schedulesLogic.sortConfig} onSort={schedulesLogic.handleSort} />
                    {canEdit && <th className="px-4 py-3 text-slate-500 uppercase">{t("Del")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {schedulesLogic.data.map(s => {
                    const batch = batches.find(b => b.id === s.batchId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{s.scheduledDate}</td>
                        <td className="px-4 py-3 text-slate-600">{batch?.breed} ({s.batchId})</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold ${s.type === 'Vaccine' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {t(s.type)}
                          </span>
                          <span className="ml-2 font-sans font-semibold text-slate-700">{s.medicationName}</span>
                        </td>
                        <td className="px-4 py-3">
                          {s.status === 'Completed' ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-sans font-semibold"><CheckCircle size={14}/> {t("Done")}</span>
                          ) : (
                            <button
                              onClick={() => handleCompleteSchedule(s.id)}
                              className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs hover:bg-indigo-100 font-sans font-semibold flex items-center gap-1"
                            >
                              <Clock size={14}/> {t("Mark Done")}
                            </button>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteSchedule(s.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 size={13} className="text-red-500" /></button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-slate-500 font-sans">{t("No active schedules.")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100">
              <TablePagination 
                currentPage={schedulesLogic.currentPage}
                totalPages={schedulesLogic.totalPages}
                totalItems={schedulesLogic.totalItems}
                pageSize={schedulesLogic.pageSize}
                onPageChange={schedulesLogic.setCurrentPage}
                onPageSizeChange={schedulesLogic.setPageSize}
              />
            </div>
          </CardContent>
        </Card>

        {/* Defined Templates */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Settings size={18} className="text-indigo-600" /> {t("Presets & Templates")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="border border-slate-200 rounded-md p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-800 uppercase">{tmpl.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-semibold">{t(tmpl.targetType)}</span>
                      {canEdit && (
                        <button onClick={() => handleDeleteTemplate(tmpl.id)} className="p-1 hover:bg-red-100 rounded" title={t("Delete Template")}>
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    {((tmpl.stages as any) || []).map((st: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs font-mono border-b border-slate-200 last:border-0 py-1">
                        <span className="text-slate-500">{t("Day")} {st.dayOffset}</span>
                        <span className="font-semibold text-slate-700">{st.medicationName} ({t(st.type)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-4">{t("No templates defined yet. Create one to automatically schedule vaccines for new batches.")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Health Event Modal */}
      <Dialog open={openLogHealth} onClose={() => setOpenLogHealth(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 605, color: '#0f172a' }}>
          {t("Log Health Event")}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>{t("Select Batch")}</InputLabel>
            <Select
              value={logBatchId}
              onChange={(e) => setLogBatchId(e.target.value)}
              label={t("Select Batch")}
              className="rounded-sm"
            >
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.id} ({b.breed} - {b.quantity} birds)</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("Medication / Vaccine Name *")}
            fullWidth
            variant="outlined"
            placeholder={t("e.g. Newcastle / Gumboro / Vitamins")}
            value={logMedicationName}
            onChange={(e) => setLogMedicationName(e.target.value)}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>{t("Type")}</InputLabel>
            <Select
              value={logType}
              onChange={(e) => setLogType(e.target.value as any)}
              label={t("Type")}
              className="rounded-sm"
            >
              <MenuItem value="Vaccine">{t("Vaccine")}</MenuItem>
              <MenuItem value="Medication">{t("Medication")}</MenuItem>
              <MenuItem value="Supplement">{t("Supplement")}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={t("Scheduled Date")}
            type="date"
            fullWidth
            variant="outlined"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setOpenLogHealth(false)} sx={{ color: '#64748b', borderRadius: 2 }}>{t("Cancel")}</MuiButton>
          <MuiButton 
            onClick={handleLogHealth} 
            variant="contained" 
            disabled={!logBatchId || !logMedicationName.trim()}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            {t("Save Event")}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Apply Template Modal */}
      <Dialog open={openApply} onClose={() => setOpenApply(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 605, color: '#0f172a' }}>
          {t("Apply Medication Template")}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>{t("Select Batch")}</InputLabel>
            <Select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              label={t("Select Batch")}
              className="rounded-sm"
            >
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.id} ({b.breed} - {b.quantity} birds)</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>{t("Select Template")}</InputLabel>
            <Select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              label={t("Select Template")}
              className="rounded-sm"
            >
              {templates.map(t_item => (
                <MenuItem key={t_item.id} value={t_item.id}>{t_item.name} ({t(t_item.targetType)})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("Start Date (Day 0)")}
            type="date"
            fullWidth
            variant="outlined"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setOpenApply(false)} sx={{ color: '#64748b', borderRadius: 2 }}>{t("Cancel")}</MuiButton>
          <MuiButton 
            onClick={handleApplyTemplate} 
            variant="contained" 
            disabled={!selectedTemplateId || !selectedBatchId}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            {t("Apply Template")}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Define Medication Template Modal */}
      <Dialog open={openTemplate} onClose={() => setOpenTemplate(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 605, color: '#0f172a' }}>
          {t("Define Medication Template")}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <TextField
            label={t("Template Name *")}
            fullWidth
            variant="outlined"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={t("e.g. Standard Broiler 8-Week Program")}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>{t("Target Flock Type")}</InputLabel>
            <Select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              label={t("Target Flock Type")}
              className="rounded-sm"
            >
              <MenuItem value="Broilers">{t("Broilers")}</MenuItem>
              <MenuItem value="Layers">{t("Layers")}</MenuItem>
              <MenuItem value="Chicks">{t("Chicks")}</MenuItem>
            </Select>
          </FormControl>
          
          <div className="mt-1 border-t border-slate-100 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">{t("Schedule Stages")}</h4>
              <span className="text-[11px] text-slate-400">{t("Day offset & medication name")}</span>
            </div>

            {stages.map((st, i) => (
              <div key={i} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5 sm:space-y-0 sm:flex sm:gap-2 sm:items-center">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 w-full items-center">
                  <div className="sm:col-span-3">
                    <TextField
                      label={t("Day Offset *")}
                      type="number"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={st.dayOffset}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[i].dayOffset = Number(e.target.value);
                        setStages(newStages);
                      }}
                      placeholder="1"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <TextField
                      label={t("Medication / Vaccine *")}
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={st.medicationName}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[i].medicationName = e.target.value;
                        setStages(newStages);
                      }}
                      placeholder={t("e.g. Newcastle")}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <FormControl variant="outlined" size="small" fullWidth>
                      <InputLabel>{t("Type")}</InputLabel>
                      <Select
                        value={st.type}
                        label={t("Type")}
                        onChange={(e) => {
                          const newStages = [...stages];
                          newStages[i].type = e.target.value as any;
                          setStages(newStages);
                        }}
                      >
                        <MenuItem value="Vaccine">{t("Vaccine")}</MenuItem>
                        <MenuItem value="Medication">{t("Medication")}</MenuItem>
                        <MenuItem value="Supplement">{t("Supplement")}</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button"
              onClick={addStageRow}
              className="text-indigo-600 text-xs font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              + {t("Add Another Stage")}
            </button>
          </div>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setOpenTemplate(false)} sx={{ color: '#64748b', borderRadius: 2 }}>
            {t("Cancel")}
          </MuiButton>
          <MuiButton 
            onClick={() => {
              if (!templateName.trim()) {
                toast.error('Please enter a Template Name');
                return;
              }
              if (stages.some(s => !s.medicationName.trim())) {
                toast.error('Please enter Medication/Vaccine Name for all schedule stages');
                return;
              }
              handleSaveTemplate();
            }} 
            variant="contained" 
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            {t("Save Template")}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
