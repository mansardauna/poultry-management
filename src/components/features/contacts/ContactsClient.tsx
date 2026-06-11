'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Users, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ContactRecord } from "@/data/types";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Select, MenuItem, FormControl, InputLabel, Button as MuiButton 
} from '@mui/material';

export function ContactsClient({ role }: { role: string }) {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRecord | null>(null);
  const canEdit = role === 'Admin' || role === 'Manager';
  const [formData, setFormData] = useState({
    name: '',
    type: 'Customer',
    contactDetails: '',
    notes: ''
  });

  const refreshData = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Contact deleted.'); }
      else toast.error('Failed to delete');
    } catch (err) { console.error(err); }
  };

  const handleEdit = (c: ContactRecord) => {
    setEditingContact(c);
    setFormData({ name: c.name, type: c.type, contactDetails: c.contactDetails, notes: c.notes });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = editingContact ? 'PUT' : 'POST';
      const body = editingContact ? { id: editingContact.id, ...formData } : formData;
      const res = await fetch('/api/contacts', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        refreshData();
        setOpen(false);
        setEditingContact(null);
        setFormData({ name: '', type: 'Customer', contactDetails: '', notes: '' });
        toast.success(editingContact ? 'Contact updated!' : 'Contact added!');
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CRM & Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage regular customers and suppliers.</p>
        </div>
        {role !== 'Staff' && (
          <button 
            onClick={() => setOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Add Contact
          </button>
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 flex justify-between items-center flex-row">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
            <Users size={18} className="text-indigo-600" /> Active Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Contact Details</th>
                  <th className="px-4 py-3 text-slate-500 uppercase">Notes</th>
                  {canEdit && <th className="px-4 py-3 text-slate-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {contacts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold ${c.type === 'Customer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.contactDetails}</td>
                    <td className="px-4 py-3 text-slate-600">{c.notes}</td>
                    {canEdit && (
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => handleEdit(c)} className="p-1 hover:bg-blue-100 rounded"><Edit2 size={14} className="text-blue-600" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 size={14} className="text-red-600" /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-500 font-sans">No contacts recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => { setOpen(false); setEditingContact(null); }} fullWidth maxWidth="sm">
        <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <TextField
            label="Name"
            fullWidth
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="Customer">Customer</MenuItem>
              <MenuItem value="Supplier">Supplier</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Contact Details (Phone/Email)"
            fullWidth
            value={formData.contactDetails}
            onChange={e => setFormData({ ...formData, contactDetails: e.target.value })}
          />
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => { setOpen(false); setEditingContact(null); }}>Cancel</MuiButton>
          <MuiButton onClick={handleSave} variant="contained" disabled={!formData.name}>{editingContact ? 'Save Changes' : 'Save'}</MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
