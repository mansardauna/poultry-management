'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Wrench, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { EquipmentInventory } from "@/data/types";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Select, MenuItem, FormControl, InputLabel, Button as MuiButton 
} from '@mui/material';

export function InventoryClient({ role }: { role: string }) {
  const [equipment, setEquipment] = useState<EquipmentInventory[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentInventory | null>(null);
  const canEdit = role === 'Admin' || role === 'Manager';
  const [formData, setFormData] = useState({
    name: '',
    type: 'Feeder',
    quantity: 1,
    status: 'Good',
    lastMaintenance: new Date().toISOString().split('T')[0]
  });

  const refreshData = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setEquipment(data.equipment || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this equipment?')) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Equipment deleted.'); }
      else toast.error('Failed to delete');
    } catch (err) { console.error(err); }
  };

  const handleEdit = (item: EquipmentInventory) => {
    setEditingItem(item);
    setFormData({ name: item.name, type: item.type, quantity: item.quantity, status: item.status, lastMaintenance: item.lastMaintenance });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...formData } : formData;
      const res = await fetch('/api/inventory', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        refreshData();
        setOpen(false);
        setEditingItem(null);
        setFormData({ name: '', type: 'Feeder', quantity: 1, status: 'Good', lastMaintenance: new Date().toISOString().split('T')[0] });
        toast.success(editingItem ? 'Equipment updated!' : 'Equipment added!');
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Equipment Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage farm equipment, feeders, drinkers, and maintenance logs.</p>
        </div>
        {role !== 'Staff' && (
          <button 
            onClick={() => setOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Add Equipment
          </button>
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 flex justify-between items-center flex-row">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
            <Wrench size={18} className="text-indigo-600" /> Active Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-slate-500 uppercase">Item Name</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Last Maintenance</th>
                  {canEdit && <th className="px-4 py-3 text-slate-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {equipment.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{eq.name}</td>
                    <td className="px-4 py-3 text-slate-600">{eq.type}</td>
                    <td className="px-4 py-3 text-slate-600">{eq.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold ${eq.status === 'Good' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{eq.lastMaintenance}</td>
                    {canEdit && (
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => handleEdit(eq)} className="p-1 hover:bg-blue-100 rounded"><Edit2 size={14} className="text-blue-600" /></button>
                        <button onClick={() => handleDelete(eq.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 size={14} className="text-red-600" /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {equipment.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-500 font-sans">No equipment recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => { setOpen(false); setEditingItem(null); }} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Equipment Name"
            fullWidth
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="flex gap-4">
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="Feeder">Feeder</MenuItem>
                <MenuItem value="Drinker">Drinker</MenuItem>
                <MenuItem value="Heater">Heater</MenuItem>
                <MenuItem value="Cage">Cage</MenuItem>
                <MenuItem value="Generator">Generator</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="flex gap-4">
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Needs Repair">Needs Repair</MenuItem>
                <MenuItem value="Broken">Broken</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Last Maintenance"
              type="date"
              fullWidth
              value={formData.lastMaintenance}
              onChange={e => setFormData({ ...formData, lastMaintenance: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => { setOpen(false); setEditingItem(null); }}>Cancel</MuiButton>
          <MuiButton onClick={handleSave} variant="contained" disabled={!formData.name}>{editingItem ? 'Save Changes' : 'Save'}</MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
