'use strict';
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { useLanguage } from "../LanguageContext";
import { useTimeFilter } from "../TimeFilterContext";
import { Plus, AlertTriangle, MapPin, Shield, Edit2, Trash2 } from 'lucide-react';
import { ChickenBatch } from "@/data/types";
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
 * Props for the ChickensClient component.
 */
interface ChickensClientProps {
  initialData: ChickenBatch[];
  role: string;
}

/**
 * Client component for managing chicken batches, mortality, vaccination, and transfers.
 * @param {ChickensClientProps} props - The component props.
 */
export function ChickensClient({ initialData, role }: ChickensClientProps) {
  const [batches, setBatches] = useState<ChickenBatch[]>(initialData);
  const { texts } = useLanguage();
  const { filterByTimeRange } = useTimeFilter();
  
  const batchesLogic = useTableLogic({
    data: filterByTimeRange(batches),
    searchFields: ['id', 'breed', 'type', 'farmSection', 'vaccinationStatus'],
    initialPageSize: 20
  });
  const canEdit = role === 'Admin' || role === 'Manager';
  
  // Modals state
  const [open, setOpen] = useState(false);
  const [openMortality, setOpenMortality] = useState(false);
  const [openVaccine, setOpenVaccine] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ChickenBatch | null>(null);

  // Add Batch Form
  const [breed, setBreed] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('Layers');
  const [farmSection, setFarmSection] = useState('Section A');
  const [vaccinationStatus, setVaccinationStatus] = useState('Up to Date');
  const [ageInWeeks, setAgeInWeeks] = useState('');

  // Mortality Form
  const [mortalityBatchId, setMortalityBatchId] = useState('');
  const [mortalityCount, setMortalityCount] = useState('');
  const [mortalityReason, setMortalityReason] = useState('');
  const [mortalityDate, setMortalityDate] = useState(new Date().toISOString().split('T')[0]);

  // Vaccination Form
  const [vaccineBatchId, setVaccineBatchId] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [nextBoosterDate, setNextBoosterDate] = useState('');

  // Transfer Form
  const [transferBatchId, setTransferBatchId] = useState('');
  const [transferCount, setTransferCount] = useState('');
  const [targetSection, setTargetSection] = useState('Section B');

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      const res = await fetch(`/api/batches?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshData();
        toast.success('Batch deleted successfully!');
      } else {
        toast.error('Failed to delete batch');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (batch: ChickenBatch) => {
    setEditingBatch(batch);
    setBreed(batch.breed);
    setQuantity(batch.quantity.toString());
    setType(batch.type);
    setFarmSection(batch.farmSection);
    setVaccinationStatus(batch.vaccinationStatus);
    setAgeInWeeks(batch.ageInWeeks.toString());
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditingBatch(null);
    handleClose(); // Reset form fields
  };

  const handleEditBatch = async () => {
    if (!editingBatch || !breed || !quantity) return;
    
    try {
      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBatch.id,
          breed,
          quantity: Number(quantity),
          type,
          farmSection,
          vaccinationStatus,
          ageInWeeks: Number(ageInWeeks) || 1
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseEdit();
        toast.success('Batch updated successfully!');
      } else {
        toast.error('Failed to update batch');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshData = async () => {
    try {
      const res = await fetch('/api/batches');
      if (res.ok) {
        const updated = await res.json();
        setBatches(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setBreed('');
    setQuantity('');
    setType('Layers');
    setFarmSection('Section A');
    setVaccinationStatus('Up to Date');
    setAgeInWeeks('');
  };

  const handleOpenMortality = () => {
    setMortalityBatchId(batches[0]?.id || '');
    setMortalityDate(new Date().toISOString().split('T')[0]);
    setOpenMortality(true);
  };
  const handleCloseMortality = () => {
    setOpenMortality(false);
    setMortalityCount('');
    setMortalityReason('');
  };

  const handleOpenVaccine = () => {
    setVaccineBatchId(batches[0]?.id || '');
    setOpenVaccine(true);
  };
  const handleCloseVaccine = () => {
    setOpenVaccine(false);
    setVaccineName('');
    setNextBoosterDate('');
  };

  const handleOpenTransfer = () => {
    setTransferBatchId(batches[0]?.id || '');
    setOpenTransfer(true);
  };
  const handleCloseTransfer = () => {
    setOpenTransfer(false);
    setTransferCount('');
    setTargetSection('Section B');
  };

  const handleAddBatch = async () => {
    if (!breed || !quantity) return;
    
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breed,
          quantity: Number(quantity),
          type,
          farmSection,
          vaccinationStatus,
          ageInWeeks: Number(ageInWeeks) || 1
        })
      });

      if (res.ok) {
        refreshData();
        handleClose();
        toast.success('Batch added successfully!');
      } else {
        toast.error('Failed to add batch');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogMortality = async () => {
    if (!mortalityBatchId || !mortalityCount) return;

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mortality',
          batchId: mortalityBatchId,
          date: mortalityDate,
          mortalityCount: Number(mortalityCount),
          reason: mortalityReason
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseMortality();
        toast.success('Mortality logged! Flock count adjusted.');
      } else {
        toast.error('Failed to log mortality');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogVaccine = async () => {
    if (!vaccineBatchId || !vaccineName) return;

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vaccination',
          batchId: vaccineBatchId,
          vaccineName,
          nextBoosterDate
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseVaccine();
        toast.success('Vaccination logged! Booster schedule created.');
      } else {
        toast.error('Failed to log vaccination');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async () => {
    if (!transferBatchId || !targetSection) return;

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          batchId: transferBatchId,
          transferCount: Number(transferCount) || 0,
          targetSection
        })
      });

      if (res.ok) {
        refreshData();
        handleCloseTransfer();
        toast.success('Birds transferred! Sections updated.');
      } else {
        toast.error('Failed to transfer birds');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Commands */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{texts.chickens.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{texts.chickens.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleOpenMortality}
            className="bg-white border-2 border-red-200 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <AlertTriangle size={18} /> Log Mortality
          </button>
          <button 
            onClick={handleOpenVaccine}
            className="bg-white border-2 border-indigo-200 text-indigo-700 px-4 py-2 text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <Shield size={18} /> Log Vaccination
          </button>
          <button 
            onClick={handleOpenTransfer}
            className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <MapPin size={18} /> Transfer Birds
          </button>
          <button 
            onClick={handleOpen}
            className="bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> {texts.chickens.addBatch}
          </button>
        </div>
      </div>

      {/* Batches Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.chickens.activeBatches}</CardTitle>
        </CardHeader>
        <CardContent>
          <TableControls searchTerm={batchesLogic.searchTerm} setSearchTerm={batchesLogic.setSearchTerm} placeholder="Search batches..." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableSortHeader label="Batch ID" sortKey="id" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  <TableSortHeader label="Type" sortKey="type" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  <TableSortHeader label="Breed" sortKey="breed" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  <TableSortHeader label="Remaining birds" sortKey="quantity" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  <TableSortHeader label="Age (Weeks)" sortKey="ageInWeeks" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  <TableSortHeader label="Mortality" sortKey="mortalityCount" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  <TableSortHeader label="Section" sortKey="farmSection" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  <TableSortHeader label="Vaccination" sortKey="vaccinationStatus" currentSort={batchesLogic.sortConfig} onSort={batchesLogic.handleSort} />
                  {canEdit && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {batchesLogic.data.map((batch) => (
                  <tr key={batch.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{batch.id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${
                        batch.type === 'Layers' ? 'bg-amber-100 text-amber-800' :
                        batch.type === 'Broilers' ? 'bg-blue-100 text-blue-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {batch.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{batch.breed}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{batch.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3">{batch.ageInWeeks}</td>
                    <td className="px-4 py-3 text-red-650 font-semibold">{batch.mortalityCount}</td>
                    <td className="px-4 py-3 font-mono text-xs">{batch.farmSection}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${
                        batch.vaccinationStatus === 'Up to Date' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-105 text-red-800 animate-pulse'
                      }`}>
                        {batch.vaccinationStatus}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => handleOpenEdit(batch)} className="text-slate-500 hover:text-indigo-600 transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(batch.id)} className="text-slate-500 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination 
            currentPage={batchesLogic.currentPage}
            totalPages={batchesLogic.totalPages}
            totalItems={batchesLogic.totalItems}
            pageSize={batchesLogic.pageSize}
            onPageChange={batchesLogic.setCurrentPage}
            onPageSizeChange={batchesLogic.setPageSize}
          />
        </CardContent>
      </Card>

      {/* Add Batch Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Add Chicken Batch</DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <TextField
            label="Breed (e.g. Isa Brown)"
            fullWidth
            variant="outlined"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
          <TextField
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <TextField
            label="Age (in weeks)"
            type="number"
            fullWidth
            variant="outlined"
            value={ageInWeeks}
            onChange={(e) => setAgeInWeeks(e.target.value)}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              label="Type"
              className="rounded-sm"
            >
              <MenuItem value="Layers">Layers</MenuItem>
              <MenuItem value="Broilers">Broilers</MenuItem>
              <MenuItem value="Chicks">Chicks</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Farm Section</InputLabel>
            <Select
              value={farmSection}
              onChange={(e) => setFarmSection(e.target.value)}
              label="Farm Section"
              className="rounded-sm"
            >
              <MenuItem value="Section A">Section A</MenuItem>
              <MenuItem value="Section B">Section B</MenuItem>
              <MenuItem value="Section C">Section C</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Vaccination Status</InputLabel>
            <Select
              value={vaccinationStatus}
              onChange={(e) => setVaccinationStatus(e.target.value)}
              label="Vaccination Status"
              className="rounded-sm"
            >
              <MenuItem value="Up to Date">Up to Date</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleClose} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleAddBatch} 
            variant="contained" 
            disabled={!breed || !quantity}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Add Batch
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Log Mortality Modal */}
      <Dialog open={openMortality} onClose={handleCloseMortality} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Record Flock Mortality</DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <SelectWithAdd
            label="Select Batch"
            value={mortalityBatchId}
            onChange={setMortalityBatchId}
            items={batches.map(b => ({ id: b.id, label: `${b.id} (${b.breed} - ${b.quantity} birds)` }))}
            addPath="/chickens"
          />
          <TextField
            label="Mortality Date"
            type="date"
            fullWidth
            variant="outlined"
            value={mortalityDate}
            onChange={(e) => setMortalityDate(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } }, inputLabel: { shrink: true } }}
          />
          <TextField
            label="Mortality count"
            type="number"
            fullWidth
            variant="outlined"
            placeholder="e.g. 1"
            value={mortalityCount}
            onChange={(e) => setMortalityCount(e.target.value)}
          />
          <TextField
            label="Reason / Diagnosis details"
            fullWidth
            variant="outlined"
            placeholder="e.g. Heat stress or physical injury"
            value={mortalityReason}
            onChange={(e) => setMortalityReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseMortality} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleLogMortality} 
            variant="contained" 
            disabled={!mortalityBatchId || !mortalityCount}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Log Mortality
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Log Vaccination Modal */}
      <Dialog open={openVaccine} onClose={handleCloseVaccine} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Log Vaccination Event</DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <SelectWithAdd
            label="Select Batch"
            value={vaccineBatchId}
            onChange={setVaccineBatchId}
            items={batches.map(b => ({ id: b.id, label: `${b.id} (${b.breed})` }))}
            addPath="/chickens"
          />
          <TextField
            label="Vaccine / Drug administered"
            fullWidth
            variant="outlined"
            placeholder="e.g. Newcastle Lasota or Gumboro"
            value={vaccineName}
            onChange={(e) => setVaccineName(e.target.value)}
          />
          <TextField
            label="Next Booster Schedule Date"
            type="date"
            fullWidth
            variant="outlined"
            value={nextBoosterDate}
            onChange={(e) => setNextBoosterDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseVaccine} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleLogVaccine} 
            variant="contained" 
            disabled={!vaccineBatchId || !vaccineName}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Log Vaccination
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Transfer Birds Modal */}
      <Dialog open={openTransfer} onClose={handleCloseTransfer} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Log Bird Transfer</DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <SelectWithAdd
            label="Select Batch"
            value={transferBatchId}
            onChange={setTransferBatchId}
            items={batches.map(b => ({ id: b.id, label: `${b.id} (${b.breed} - ${b.quantity} birds in ${b.farmSection})` }))}
            addPath="/chickens"
          />
          <TextField
            label="Transfer Count (leave empty for entire batch)"
            type="number"
            fullWidth
            variant="outlined"
            placeholder="e.g. 15"
            value={transferCount}
            onChange={(e) => setTransferCount(e.target.value)}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Target Section</InputLabel>
            <Select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              label="Target Section"
              className="rounded-sm"
            >
              <MenuItem value="Section A">Section A</MenuItem>
              <MenuItem value="Section B">Section B</MenuItem>
              <MenuItem value="Section C">Section C</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseTransfer} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleTransfer} 
            variant="contained" 
            disabled={!transferBatchId || !targetSection}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Transfer Birds
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Edit Batch Modal */}
      <Dialog open={openEdit} onClose={handleCloseEdit} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 605 }}>Edit Chicken Batch</DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <TextField
            label="Breed (e.g. Isa Brown)"
            fullWidth
            variant="outlined"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
          <TextField
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <TextField
            label="Age (in weeks)"
            type="number"
            fullWidth
            variant="outlined"
            value={ageInWeeks}
            onChange={(e) => setAgeInWeeks(e.target.value)}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              label="Type"
              className="rounded-sm"
            >
              <MenuItem value="Layers">Layers</MenuItem>
              <MenuItem value="Broilers">Broilers</MenuItem>
              <MenuItem value="Chicks">Chicks</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Farm Section</InputLabel>
            <Select
              value={farmSection}
              onChange={(e) => setFarmSection(e.target.value)}
              label="Farm Section"
              className="rounded-sm"
            >
              <MenuItem value="Section A">Section A</MenuItem>
              <MenuItem value="Section B">Section B</MenuItem>
              <MenuItem value="Section C">Section C</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Vaccination Status</InputLabel>
            <Select
              value={vaccinationStatus}
              onChange={(e) => setVaccinationStatus(e.target.value)}
              label="Vaccination Status"
              className="rounded-sm"
            >
              <MenuItem value="Up to Date">Up to Date</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseEdit} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleEditBatch} 
            variant="contained" 
            disabled={!breed || !quantity}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Save Changes
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
