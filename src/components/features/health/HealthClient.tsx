'use strict';
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Calendar, Settings, CheckCircle, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { DatabaseSchema, MedicationTemplate, MedicationSchedule, ChickenBatch } from "@/data/types";
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
  const [templates, setTemplates] = useState<MedicationTemplate[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [batches, setBatches] = useState<ChickenBatch[]>([]);
  const canEdit = role === 'Admin' || role === 'Manager';

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

  const refreshData = async () => {
    try {
      const res = await fetch('/api/all');
      if (res.ok) {
        const data = await res.json() as DatabaseSchema;
        setTemplates(data.medicationTemplates || []);
        setSchedules(data.medicationSchedules || []);
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        refreshData();
        setOpenTemplate(false);
        setTemplateName('');
        setStages([{ dayOffset: 1, medicationName: '', type: 'Vaccine' }]);
      }
    } catch (err) {
      console.error(err);
    }
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
        refreshData();
        setOpenApply(false);
        setSelectedTemplateId('');
        setSelectedBatchId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeSchedule', id })
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Delete this schedule entry?')) return;
    try {
      const res = await fetch(`/api/health?id=${id}&type=schedule`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Schedule deleted.'); }
      else toast.error('Failed to delete');
    } catch (err) { console.error(err); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? All linked schedules will remain.')) return;
    try {
      const res = await fetch(`/api/health?id=${id}&type=template`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Template deleted.'); }
      else toast.error('Failed to delete');
    } catch (err) { console.error(err); }
  };

  const addStageRow = () => {
    setStages([...stages, { dayOffset: stages.length + 1, medicationName: '', type: 'Vaccine' }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Health & Vaccinations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage flock medication routines and vaccination schedules.</p>
        </div>
        {role !== 'Staff' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setOpenApply(true)}
              className="bg-white border-2 border-indigo-200 text-indigo-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              <Calendar size={20} /> Apply Template
            </button>
            <button 
              onClick={() => setOpenTemplate(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Define New Template
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Schedules */}
        <Card>
          <CardHeader className="border-b border-slate-100 flex justify-between items-center flex-row">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" /> Active Roster Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-x-auto overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-slate-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-slate-500 uppercase">Medication</th>
                    <th className="px-4 py-3 text-slate-500 uppercase">Status</th>
                    {canEdit && <th className="px-4 py-3 text-slate-500 uppercase">Del</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {schedules.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()).map(s => {
                    const batch = batches.find(b => b.id === s.batchId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{s.scheduledDate}</td>
                        <td className="px-4 py-3 text-slate-600">{batch?.breed} ({s.batchId})</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold ${s.type === 'Vaccine' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {s.type}
                          </span>
                          <span className="ml-2 font-sans font-semibold text-slate-700">{s.medicationName}</span>
                        </td>
                        <td className="px-4 py-3">
                          {s.status === 'Completed' ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-sans font-semibold"><CheckCircle size={14}/> Done</span>
                          ) : (
                            <button
                              onClick={() => handleCompleteSchedule(s.id)}
                              className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs hover:bg-indigo-100 font-sans font-semibold flex items-center gap-1"
                            >
                              <Clock size={14}/> Mark Done
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
                      <td colSpan={4} className="text-center py-4 text-slate-500 font-sans">No active schedules.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Defined Templates */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Settings size={18} className="text-indigo-600" /> Presets & Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {templates.map(t => (
                <div key={t.id} className="border border-slate-200 rounded-md p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-800 uppercase">{t.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-semibold">{t.targetType}</span>
                      {canEdit && (
                        <button onClick={() => handleDeleteTemplate(t.id)} className="p-1 hover:bg-red-100 rounded" title="Delete Template">
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    {((t.stages as any) || []).map((st: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs font-mono border-b border-slate-200 last:border-0 py-1">
                        <span className="text-slate-500">Day {st.dayOffset}</span>
                        <span className="font-semibold text-slate-700">{st.medicationName} ({st.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-4">No templates defined yet. Create one to automatically schedule vaccines for new batches.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apply Template Modal */}
      <Dialog open={openApply} onClose={() => setOpenApply(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-poppins)', textTransform: 'uppercase', fontWeight: 600 }}>Apply Medication Template</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select Batch</InputLabel>
            <Select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              label="Select Batch"
              className="rounded-lg"
            >
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.id} ({b.breed} - {b.quantity} birds)</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select Template</InputLabel>
            <Select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              label="Select Template"
              className="rounded-lg"
            >
              {templates.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name} ({t.targetType})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Start Date (Day 0)"
            type="date"
            fullWidth
            variant="outlined"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setOpenApply(false)} sx={{ color: '#64748b' }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleApplyTemplate} 
            variant="contained" 
            disabled={!selectedTemplateId || !selectedBatchId}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Apply Template
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Add Template Modal */}
      <Dialog open={openTemplate} onClose={() => setOpenTemplate(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-poppins)', textTransform: 'uppercase', fontWeight: 600 }}>Define Medication Template</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Template Name"
            fullWidth
            variant="outlined"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Standard Broiler 8-Week Program"
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Target Flock Type</InputLabel>
            <Select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              label="Target Flock Type"
              className="rounded-lg"
            >
              <MenuItem value="Broilers">Broilers</MenuItem>
              <MenuItem value="Layers">Layers</MenuItem>
              <MenuItem value="Chicks">Chicks</MenuItem>
            </Select>
          </FormControl>
          
          <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Schedule Stages</h4>
            {stages.map((st, i) => (
              <div key={i} className="flex gap-2 items-center">
                <TextField
                  label="Day Offset"
                  type="number"
                  variant="outlined"
                  size="small"
                  className="w-24"
                  value={st.dayOffset}
                  onChange={(e) => {
                    const newStages = [...stages];
                    newStages[i].dayOffset = Number(e.target.value);
                    setStages(newStages);
                  }}
                />
                <TextField
                  label="Medication Name"
                  variant="outlined"
                  size="small"
                  className="flex-1"
                  value={st.medicationName}
                  onChange={(e) => {
                    const newStages = [...stages];
                    newStages[i].medicationName = e.target.value;
                    setStages(newStages);
                  }}
                />
                <FormControl variant="outlined" size="small" className="w-32">
                  <Select
                    value={st.type}
                    onChange={(e) => {
                      const newStages = [...stages];
                      newStages[i].type = e.target.value as any;
                      setStages(newStages);
                    }}
                  >
                    <MenuItem value="Vaccine">Vaccine</MenuItem>
                    <MenuItem value="Medication">Medication</MenuItem>
                    <MenuItem value="Supplement">Supplement</MenuItem>
                  </Select>
                </FormControl>
              </div>
            ))}
            <button 
              onClick={addStageRow}
              className="text-indigo-600 text-xs font-semibold hover:underline"
            >
              + Add Stage
            </button>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => setOpenTemplate(false)} sx={{ color: '#64748b' }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleSaveTemplate} 
            variant="contained" 
            disabled={!templateName || stages.some(s => !s.medicationName)}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Save Template
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
