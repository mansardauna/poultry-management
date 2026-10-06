'use strict';
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Wallet, ArrowDown, ArrowUp, Coins, Percent, User, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from "../LanguageContext";
import { useTimeFilter } from "../TimeFilterContext";
import { Expense, Sale } from "@/data/types";
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
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
  const { texts, t, formatCurrency, currencySymbol } = useLanguage();
  const { filterByTimeRange } = useTimeFilter();
  const { confirm } = useConfirm();
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const canEdit = role === 'Admin';
  
  // New Expense Form
  const [category, setCategory] = useState('Feed');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Real Financial Calculations - 100% derived from actual table transactions


  const expensesLogic = useTableLogic({
    data: filterByTimeRange(expenses),
    searchFields: ['id', 'date', 'category', 'description'],
    initialPageSize: 20
  });

  const refreshData = async () => {
    try {
      const res = await fetch('/api/finance');
      if (res.ok) {
        const updated = await res.json();
        setSales(updated.sales);
        setExpenses(updated.expenses);
      }
    } catch {}
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
    } catch {}
  };

  const handleDeleteExpense = async (id: string) => {
    if (!await confirm(t('Delete this expense record?', 'Delete this expense record?'))) return;
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Expense deleted.'); }
      else toast.error('Failed to delete expense');
    } catch {}
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
    } catch {}
  };

  const handleProcessPayroll = async () => {
    const isConfirmed = await confirm({
      title: t('Process Payroll', 'Process Payroll'),
      message: t("Process payroll for all active staff? This will compute salaries and add them as expenses.", "Process payroll for all active staff? This will compute salaries and add them as expenses."),
      confirmText: t('Process Payroll', 'Process Payroll'),
      variant: 'info'
    });
    if (!isConfirmed) return;

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
    } catch {}
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Financial Statement - Poultry Farm', 14, 22);
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
  const cashSales = filteredSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.totalAmount, 0);
  const bankSales = filteredSales.filter(s => s.paymentMethod === 'Bank transfer' || s.paymentMethod === 'POS').reduce((sum, s) => sum + s.totalAmount, 0);
  
  // Formula Reconciliation - 100% from recorded transactions
  const netBalance = totalRevenue - totalExpenses; 
  const netProfit = totalRevenue - totalExpenses;   
  const returnEfficiency = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={texts.finance.title}
        subtitle={texts.finance.subtitle}
        actions={
          <>
            <button 
              onClick={handleExportPDF}
              className="bg-white border border-slate-300 text-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              {t("Export PDF")}
            </button>
            <button 
              onClick={handleProcessPayroll}
              className="bg-white border border-indigo-200 text-indigo-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <User size={17} /> {t("Process Payroll")}
            </button>
            <button 
              onClick={handleOpen}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={18} /> {texts.finance?.logExpense || t("Log Expense")}
            </button>
          </>
        }
      />

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={texts.finance?.totalRevenue || "Total Revenue"}
          value={`₦${totalRevenue.toLocaleString()}`}
          subtext="From Wednesday wholesale sales"
          icon={ArrowUp}
          color="indigo"
        />
        <StatCard
          title={texts.finance?.totalExpenses || "Total Expenses"}
          value={`₦${totalExpenses.toLocaleString()}`}
          subtext="Feed, fuel and sanitation tools"
          icon={ArrowDown}
          color="rose"
        />
        <StatCard
          title="Remaining Asset Balance"
          value={`₦${netBalance.toLocaleString()}`}
          subtext="Reconciled & Audited"
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Return Efficiency Rate"
          value={`${returnEfficiency}%`}
          subtext={`Net Profit: ₦${netProfit.toLocaleString()}`}
          icon={Percent}
          color="blue"
        />
      </div>

      {/* Cash Flow Reconciliation Sheet */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
            Farm Cash Flow Reconciliation Sheet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recorded Revenue & Inflows */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Coins size={16} className="text-indigo-600" /> 1. Recorded Revenue & Inflows
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold py-1">
                  <span>Egg Sales Revenue Inflow:</span>
                  <span className="text-indigo-600 font-mono">₦{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500 text-[11px]">
                  <div className="flex justify-between">
                    <span>• Cash Collections:</span>
                    <span className="font-mono">₦{cashSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Bank Transfer / POS Collections:</span>
                    <span className="font-mono">₦{bankSales.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between font-semibold text-slate-900 border-t-2 border-slate-200 pt-2 mt-3 text-sm">
                  <span>Total Inflow Pool:</span>
                  <span className="font-mono">₦{totalRevenue.toLocaleString()}</span>
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
                  <span className="text-red-600">-{formatCurrency(totalExpenses)}</span>
                </div>

                <div className="flex justify-between font-semibold text-indigo-900 bg-indigo-50 border-2 border-indigo-200 p-3 mt-4 text-sm">
                  <span>Reconciled Net Balance Asset:</span>
                  <span>{formatCurrency(netBalance)}</span>
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
          <div className="mb-4">
            <TableControls searchTerm={expensesLogic.searchTerm} setSearchTerm={expensesLogic.setSearchTerm} placeholder={t("Search expenses...")} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <TableSortHeader label="Expense ID" sortKey="id" currentSort={expensesLogic.sortConfig} onSort={expensesLogic.handleSort} />
                  <TableSortHeader label="Date" sortKey="date" currentSort={expensesLogic.sortConfig} onSort={expensesLogic.handleSort} />
                  <TableSortHeader label="Category" sortKey="category" currentSort={expensesLogic.sortConfig} onSort={expensesLogic.handleSort} />
                  <TableSortHeader label="Description" sortKey="description" currentSort={expensesLogic.sortConfig} onSort={expensesLogic.handleSort} />
                  <TableSortHeader label="Amount" sortKey="amount" currentSort={expensesLogic.sortConfig} onSort={expensesLogic.handleSort} />
                  {canEdit && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {expensesLogic.data.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-950">{expense.id}</td>
                    <td className="px-4 py-3 text-slate-400">{expense.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 uppercase ${
                        expense.category === 'Salaries' ? 'bg-amber-100 text-amber-800' :
                        expense.category === 'Feed' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{expense.description}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">-{formatCurrency(expense.amount)}</td>
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
          <div className="mt-4">
            <TablePagination 
              currentPage={expensesLogic.currentPage}
              totalPages={expensesLogic.totalPages}
              totalItems={expensesLogic.totalItems}
              pageSize={expensesLogic.pageSize}
              onPageChange={expensesLogic.setCurrentPage}
              onPageSizeChange={expensesLogic.setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Log Expense Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 600 }}>{t("Log New Expense")}</DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>{t("Expense Category")}</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label={t("Expense Category")}
              className="rounded-sm"
            >
              <MenuItem value="Feed">{t("Feed")}</MenuItem>
              <MenuItem value="Drugs">{t("Drugs & Vaccines")}</MenuItem>
              <MenuItem value="Salaries">{t("Staff Salaries")}</MenuItem>
              <MenuItem value="Maintenance">{t("Maintenance & Repairs")}</MenuItem>
              <MenuItem value="Utilities">{t("Utilities & Fuel")}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={`${t("Amount")} (${currencySymbol})`}
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label={t("Description / Purpose")}
            fullWidth
            variant="outlined"
            placeholder={t("e.g. Layer Bird Feed Supply")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleClose} sx={{ color: '#64748b', borderRadius: 2 }}>{t("Cancel")}</MuiButton>
          <MuiButton 
            onClick={handleAddExpense} 
            variant="contained" 
            disabled={!amount || !description}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            {t("Log Expense")}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={openEdit} onClose={() => { setOpenEdit(false); setEditingExpense(null); }} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 600 }}>{t("Edit Expense")}</DialogTitle>
        <DialogContent className="flex flex-col gap-5 sm:gap-4 pt-5 pb-3">
          <div className="h-2" />
          <FormControl fullWidth variant="outlined">
            <InputLabel shrink>{t("Expense Category")}</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label={t("Expense Category")} className="rounded-sm">
              <MenuItem value="Feed">{t("Feed")}</MenuItem>
              <MenuItem value="Drugs">{t("Drugs & Vaccines")}</MenuItem>
              <MenuItem value="Salaries">{t("Staff Salaries")}</MenuItem>
              <MenuItem value="Maintenance">{t("Maintenance & Repairs")}</MenuItem>
              <MenuItem value="Utilities">{t("Utilities & Fuel")}</MenuItem>
            </Select>
          </FormControl>
          <TextField label={`${t("Amount")} (${currencySymbol})`} type="number" fullWidth variant="outlined" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label={t("Description / Purpose")} fullWidth variant="outlined" value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={() => { setOpenEdit(false); setEditingExpense(null); }} sx={{ color: '#64748b', borderRadius: 2 }}>{t("Cancel")}</MuiButton>
          <MuiButton onClick={handleUpdateExpense} variant="contained" disabled={!amount || !description} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}>{t("Save Changes")}</MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
