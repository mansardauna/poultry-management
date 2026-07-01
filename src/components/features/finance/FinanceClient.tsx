'use strict';
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Wallet, ArrowDown, ArrowUp, Coins, Percent, User, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from "../LanguageContext";
import { useTimeFilter } from "../TimeFilterContext";
import { Expense, Sale } from "@/data/types";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
 * Props for the FinanceClient component.
 */
interface FinanceClientProps {
  initialSales: Sale[];
  initialExpenses: Expense[];
  role: string;
}

/**
 * FinanceClient component for managing farm finances.
 * @param props The component props.
 */
export function FinanceClient({ initialSales, initialExpenses, role }: FinanceClientProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const { texts } = useLanguage();
  const { filterByTimeRange } = useTimeFilter();
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const canEdit = role === 'Admin';
  
  // New Expense Form
  const [category, setCategory] = useState('Feed');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Fixed Gaa Saka Farm Balances
  const openingFund = 16800; // ₦16,800
  const cashPortion = 5800;  // ₦5,800
  const bankPortion = 11000; // ₦11,000

  const refreshData = async () => {
    try {
      const res = await fetch('/api/finance');
      if (res.ok) {
        const updated = await res.json();
        setSales(updated.sales);
        setExpenses(updated.expenses);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setCategory('Feed');
    setAmount('');
    setDescription('');
  };

  const handleAddExpense = async () => {
    if (!amount || !description) return;

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          description
        })
      });

      if (res.ok) {
        refreshData();
        handleClose();
        toast.success('Expense logged successfully!');
      } else {
        toast.error('Failed to log expense');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Expense deleted.'); }
      else toast.error('Failed to delete expense');
    } catch (err) { console.error(err); }
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setCategory(expense.category);
    setAmount(String(expense.amount));
    setDescription(expense.description);
    setOpenEdit(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !amount || !description) return;
    try {
      const res = await fetch('/api/finance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingExpense.id, category, amount: Number(amount), description })
      });
      if (res.ok) { refreshData(); setOpenEdit(false); setEditingExpense(null); toast.success('Expense updated!'); }
      else toast.error('Failed to update expense');
    } catch (err) { console.error(err); }
  };

  const handleProcessPayroll = async () => {
    const confirm = window.confirm("Process payroll for all active staff? This will compute salaries and add them as expenses.");
    if (!confirm) return;

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payroll',
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        const data = await res.json();
        refreshData();
        toast.success(`Payroll processed! ₦${data.totalDisbursement.toLocaleString()} disbursed across staff.`);
      } else {
        toast.error('Failed to process payroll');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Financial Statement - Gaa Saka Farm', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Category', 'Description', 'Amount (NGN)']],
      body: expenses.map(e => [e.date, e.category, e.description, e.amount.toString()]),
    });
    doc.save('farm-financial-report.pdf');
    toast.success('PDF Exported Successfully!');
  };

  const filteredSales = filterByTimeRange(sales);
  const filteredExpenses = filterByTimeRange(expenses);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Gaa Saka Formula Reconciliation
  const netInflowPool = openingFund + totalRevenue;
  const netBalance = netInflowPool - totalExpenses; 
  const netProfit = totalRevenue - totalExpenses;   
  const returnEfficiency = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{texts.finance.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{texts.finance.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            Export PDF
          </button>
          <button 
            onClick={handleProcessPayroll}
            className="bg-white border-2 border-indigo-200 text-indigo-750 px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <User size={18} /> Process Payroll
          </button>
          <button 
            onClick={handleOpen}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> {texts.finance.logExpense}
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{texts.finance.totalRevenue}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-indigo-600">
                <ArrowUp size={32} />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-3">From Wednesday wholesale sales</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{texts.finance.totalExpenses}</p>
                <p className="text-2xl font-semibold text-red-650 mt-2">₦{totalExpenses.toLocaleString()}</p>
              </div>
              <div className="text-red-500">
                <ArrowDown size={32} />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-3">Feed, fuel and sanitation tools</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining Asset Balance</p>
                <p className="text-2xl font-semibold text-indigo-600 mt-2">₦{netBalance.toLocaleString()}</p>
              </div>
              <div className="text-blue-500">
                <Wallet size={32} />
              </div>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-3">Reconciled & Audited</div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-950 text-white border-0 rounded-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Return Efficiency Rate</p>
                <p className="text-2xl font-semibold text-white mt-2">{returnEfficiency}%</p>
              </div>
              <div className="text-blue-400">
                <Percent size={32} />
              </div>
            </div>
            <div className="text-[10px] text-indigo-300 mt-3 font-semibold">Net Profit: ₦{netProfit.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Reconciliation Sheet */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
            Gaa Saka Farm Cash Flow Reconciliation Sheet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Opening Funds & Inflows */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Coins size={16} className="text-indigo-600" /> 1. Opening Balance & Inflows
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold py-1">
                  <span>Opening Fund Carried Forward:</span>
                  <span className="text-slate-900">₦{openingFund.toLocaleString()}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500 text-[11px]">
                  <div className="flex justify-between">
                    <span>• Cash Account Balance:</span>
                    <span>₦{cashPortion.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Bank Transfer Account Balance:</span>
                    <span>₦{bankPortion.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between font-semibold py-1 border-t border-slate-100 pt-2 mt-2">
                  <span>Egg Sales Revenue Inflow:</span>
                  <span className="text-indigo-600">₦{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500 text-[11px]">
                  <div className="flex justify-between flex-wrap gap-1">
                    <span>• Dynamic collection inflow ledger:</span>
                    <span>₦{totalRevenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between font-semibold text-slate-900 border-t-2 border-slate-200 pt-2 mt-3 text-sm">
                  <span>Total Cash Inflow Pool:</span>
                  <span>₦{netInflowPool.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Outflows and Net Asset reconciliation */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Wallet size={16} className="text-indigo-600" /> 2. Outflows & Net Asset Balance
              </h3>
              <div className="space-y-2 text-xs">
                {expenses.slice(0, 6).map((expense) => (
                  <div key={expense.id} className="flex justify-between font-semibold py-1">
                    <span className="truncate max-w-[220px]">{expense.description || expense.category}:</span>
                    <span className="text-red-600">-₦{expense.amount.toLocaleString()}</span>
                  </div>
                ))}
                
                {expenses.length > 6 && (
                  <div className="text-[10px] text-slate-400 italic">
                    + {expenses.length - 6} more transaction lines in ledger below.
                  </div>
                )}

                <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span>Total Operational Disbursements:</span>
                  <span className="text-red-605">-₦{totalExpenses.toLocaleString()}</span>
                </div>

                <div className="flex justify-between font-semibold text-indigo-900 bg-indigo-50 border-2 border-indigo-200 p-3 mt-4 text-sm">
                  <span>Reconciled Net Balance Asset:</span>
                  <span>₦{netBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Ledger Table */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle>{texts.finance.expenseLedger}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Expense ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  {canEdit && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-950">{expense.id}</td>
                    <td className="px-4 py-3 text-slate-400">{expense.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 uppercase ${
                        expense.category === 'Salaries' ? 'bg-amber-100 text-amber-800' :
                        expense.category === 'Feed' ? 'bg-indigo-100 text-indigo-850' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{expense.description}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">-₦{expense.amount.toLocaleString()}</td>
                    {canEdit && (
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => handleOpenEdit(expense)} className="p-1 hover:bg-blue-100 rounded transition-colors" title="Edit">
                          <Edit2 size={14} className="text-blue-600" />
                        </button>
                        <button onClick={() => handleDeleteExpense(expense.id)} className="p-1 hover:bg-red-100 rounded transition-colors" title="Delete">
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

      {/* Log Expense Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 600 }}>Log New Expense</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Expense Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Expense Category"
              className="rounded-sm"
            >
              <MenuItem value="Feed">Feed</MenuItem>
              <MenuItem value="Drugs">Drugs & Vaccines</MenuItem>
              <MenuItem value="Salaries">Staff Salaries</MenuItem>
              <MenuItem value="Maintenance">Maintenance & Repairs</MenuItem>
              <MenuItem value="Utilities">Utilities & Fuel</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Amount (₦)"
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Description / Purpose"
            fullWidth
            variant="outlined"
            placeholder="e.g. Layer Bird Feed Supply"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleClose} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleAddExpense} 
            variant="contained" 
            disabled={!amount || !description}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Log Expense
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={openEdit} onClose={() => { setOpenEdit(false); setEditingExpense(null); }} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 600 }}>Edit Expense</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Expense Category</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Expense Category" className="rounded-sm">
              <MenuItem value="Feed">Feed</MenuItem>
              <MenuItem value="Drugs">Drugs &amp; Vaccines</MenuItem>
              <MenuItem value="Salaries">Staff Salaries</MenuItem>
              <MenuItem value="Maintenance">Maintenance &amp; Repairs</MenuItem>
              <MenuItem value="Utilities">Utilities &amp; Fuel</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Amount (₦)" type="number" fullWidth variant="outlined" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label="Description / Purpose" fullWidth variant="outlined" value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => { setOpenEdit(false); setEditingExpense(null); }} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton onClick={handleUpdateExpense} variant="contained" disabled={!amount || !description} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}>Save Changes</MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
