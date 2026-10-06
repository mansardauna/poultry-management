'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Wrench, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { EquipmentInventory } from "@/data/types";
import { useLanguage } from '../LanguageContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { BadgeStatus } from '@/components/ui/BadgeStatus';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Select, MenuItem, FormControl, InputLabel, Button as MuiButton 
} from '@mui/material';

/**
 * InventoryClient component for managing equipment inventory.
 * @param props The component props.
 * @param props.role The user role.
 */
export function InventoryClient({ role }: { role: string }) {
  const { t, formatNumber } = useLanguage();
  const { confirm } = useConfirm();
  const [equipment, setEquipment] = useState<EquipmentInventory[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentInventory | null>(null);
  const canEdit = role === 'Admin' || role === 'Manager';
  const tableLogic = useTableLogic({ 
    data: equipment, 
    searchFields: ['name', 'type', 'status'], 
    initialPageSize: 20 
  });
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
    } catch {}
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!await confirm(t('Delete this equipment?', 'Delete this equipment?'))) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      if (res.ok) { 
        setEquipment(prev => prev.filter(eq => eq.id !== id));
        refreshData(); 
        toast.success('Equipment deleted.'); 
      }
      else toast.error('Failed to delete');
    } catch {}
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
        const saved = await res.json();
        if (editingItem) {
          setEquipment(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...formData, quantity: Number(formData.quantity) } : item));
        } else if (saved && saved.id) {
          setEquipment(prev => [saved, ...prev]);
        }
        refreshData();
        setOpen(false);
        setEditingItem(null);
        setFormData({ name: '', type: 'Feeder', quantity: 1, status: 'Good', lastMaintenance: new Date().toISOString().split('T')[0] });
        toast.success(editingItem ? 'Equipment updated!' : 'Equipment added!');
      } else {
        toast.error('Failed to save equipment');
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Inventory"
        subtitle="Manage farm equipment, feeders, drinkers, and maintenance logs."
        actions={
          role !== 'Staff' ? (
            <button 
              onClick={() => setOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={18} /> {t("Add Equipment")}
            </button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="border-b border-slate-100 flex justify-between items-center flex-row">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
            <Wrench size={18} className="text-indigo-600" /> {t("Active Inventory")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TableControls searchTerm={tableLogic.searchTerm} setSearchTerm={tableLogic.setSearchTerm} placeholder={t("Search equipment...")} />
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableSortHeader label={t("Item Name")} sortKey="name" currentSort={tableLogic.sortConfig} onSort={tableLogic.handleSort} />
                  <TableSortHeader label={t("Type")} sortKey="type" currentSort={tableLogic.sortConfig} onSort={tableLogic.handleSort} />
                  <TableSortHeader label={t("Quantity")} sortKey="quantity" currentSort={tableLogic.sortConfig} onSort={tableLogic.handleSort} />
                  <TableSortHeader label={t("Status")} sortKey="status" currentSort={tableLogic.sortConfig} onSort={tableLogic.handleSort} />
                  <TableSortHeader label={t("Last Maintenance")} sortKey="lastMaintenance" currentSort={tableLogic.sortConfig} onSort={tableLogic.handleSort} />
                  {canEdit && <th className="px-4 py-3 text-slate-500 uppercase">{t("Actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {tableLogic.data.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{eq.name}</td>
                    <td className="px-4 py-3 text-slate-600">{t(eq.type)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatNumber(eq.quantity)}</td>
                    <td className="px-4 py-3">
                      <BadgeStatus status={eq.status} />
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
                    <td colSpan={5} className="text-center py-4 text-slate-500 font-sans">{t("No equipment recorded.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination 
            currentPage={tableLogic.currentPage}
            totalPages={tableLogic.totalPages}
            totalItems={tableLogic.totalItems}
            pageSize={tableLogic.pageSize}
            onPageChange={tableLogic.setCurrentPage}
            onPageSizeChange={tableLogic.setPageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => { setOpen(false); setEditingItem(null); }} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 605 }}>{editingItem ? t('Edit Equipment') : t('Add Equipment')}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label={t("Equipment Name")}
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="flex gap-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel>{t("Type")}</InputLabel>
              <Select
                value={formData.type}
                label={t("Type")}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="rounded-sm"
              >
                <MenuItem value="Feeder">{t("Feeder")}</MenuItem>
                <MenuItem value="Drinker">{t("Drinker")}</MenuItem>
                <MenuItem value="Heater">{t("Heater")}</MenuItem>
                <MenuItem value="Cage">{t("Cage")}</MenuItem>
                <MenuItem value="Generator">{t("Generator")}</MenuItem>
                <MenuItem value="Other">{t("Other")}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t("Quantity")}
              type="number"
              fullWidth
              variant="outlined"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="flex gap-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel>{t("Status")}</InputLabel>
              <Select
                value={formData.status}
                label={t("Status")}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="rounded-sm"
              >
                <MenuItem value="Good">{t("Good")}</MenuItem>
                <MenuItem value="Needs Repair">{t("Needs Repair")}</MenuItem>
                <MenuItem value="Broken">{t("Broken")}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t("Last Maintenance")}
              type="date"
              fullWidth
              variant="outlined"
              value={formData.lastMaintenance}
              onChange={e => setFormData({ ...formData, lastMaintenance: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => { setOpen(false); setEditingItem(null); }} sx={{ color: '#64748b', borderRadius: 2 }}>{t("Cancel")}</MuiButton>
          <MuiButton onClick={handleSave} variant="contained" disabled={!formData.name} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}>{editingItem ? t('Save Changes') : t('Add Item')}</MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
