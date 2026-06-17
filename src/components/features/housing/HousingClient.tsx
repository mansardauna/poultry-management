'use strict';
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Home, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { FarmPen, ChickenBatch } from "@/data/types";
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

  const refreshData = async () => {
    try {
      const res = await fetch('/api/housing');
      if (res.ok) {
        const data = await res.json();
        setPens(data.farmPens || []);
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pen?')) return;
    try {
      const res = await fetch(`/api/housing?id=${id}`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Pen deleted.'); }
      else toast.error('Failed to delete pen');
    } catch (err) { console.error(err); }
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
        refreshData();
        setOpen(false);
        setEditingPen(null);
        setFormData({ name: '', capacity: 1000, status: 'Active', currentBatchId: '' });
        toast.success(editingPen ? 'Pen updated!' : 'Pen added!');
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Housing & Pens</h1>
          <p className="text-sm text-slate-500 mt-1">Manage farm housing, capacities, and batch assignments.</p>
        </div>
        {role !== 'Staff' && (
          <button 
            onClick={() => setOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Add Pen
          </button>
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 flex justify-between items-center flex-row">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
            <Home size={18} className="text-indigo-600" /> Farm Pens
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-slate-500 uppercase">Pen Name</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Capacity</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Current Batch</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Status</th>
                  {canEdit && <th className="px-4 py-3 text-slate-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pens.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.capacity.toLocaleString()} birds</td>
                    <td className="px-4 py-3 text-slate-600">{p.currentBatchId || 'Empty'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Cleaning' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                        {p.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => handleEdit(p)} className="p-1 hover:bg-blue-100 rounded transition-colors" title="Edit"><Edit2 size={14} className="text-blue-600" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-100 rounded transition-colors" title="Delete"><Trash2 size={14} className="text-red-600" /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {pens.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 5 : 4} className="text-center py-4 text-slate-500 font-sans">No farm pens recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => { setOpen(false); setEditingPen(null); setFormData({ name: '', capacity: 1000, status: 'Active', currentBatchId: '' }); }} fullWidth maxWidth="sm">
        <DialogTitle>{editingPen ? 'Edit Farm Pen' : 'Add Farm Pen'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Pen Name"
            fullWidth
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Broiler Pen A"
          />
          <TextField
            label="Capacity (Birds)"
            type="number"
            fullWidth
            value={formData.capacity}
            onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Cleaning">Cleaning</MenuItem>
              <MenuItem value="Empty">Empty</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Assign Batch (Optional)</InputLabel>
            <Select
              value={formData.currentBatchId}
              label="Assign Batch (Optional)"
              onChange={e => setFormData({ ...formData, currentBatchId: e.target.value })}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {batches.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.breed} ({b.id}) - {b.quantity} birds</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => { setOpen(false); setEditingPen(null); }}>Cancel</MuiButton>
          <MuiButton onClick={handleSave} variant="contained" disabled={!formData.name}>{editingPen ? 'Save Changes' : 'Save'}</MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
