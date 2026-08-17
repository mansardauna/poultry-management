'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Coins, FileText, MessageSquare, Printer, Trash2, X, Link as LinkIcon, Copy, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TEXTS } from "@/lib/constants/texts";
import { Sale, Invoice, ChickenBatch } from "@/data/types";
import { downloadCSV, printBrandedReport } from '@/lib/exportReports';
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

interface SalesClientProps {
  initialSales: Sale[];
  initialInvoices: Invoice[];
  batches: ChickenBatch[];
  role?: string;
}

export function SalesClient({ initialSales, initialInvoices, batches, role = 'Staff' }: SalesClientProps) {
  const canEdit = role === 'Admin';
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activeBatches, setActiveBatches] = useState<ChickenBatch[]>(batches);
  
  // Navigation tabs: 'invoices' displays ALL invoices, 'sales' displays completed sales
  const [activeTab, setActiveTab] = useState<'invoices' | 'sales' | 'unpaid-invoices'>('invoices');

  const salesTable = useTableLogic({ 
    data: sales, 
    searchFields: ['customerName', 'type', 'paymentMethod', 'status'], 
    initialPageSize: 20 
  });

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'unpaid-invoices') return inv.status !== 'Paid';
    return true; // Show ALL invoices (Paid, Unpaid, Pending) on main invoices tab
  });

  const invoicesTable = useTableLogic({ 
    data: filteredInvoices, 
    searchFields: ['customerName', 'id', 'status', 'items'], 
    initialPageSize: 20 
  });

  const [open, setOpen] = useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [openInvoiceView, setOpenInvoiceView] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // New Sale Form
  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState('Eggs');
  const [quantity, setQuantity] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'b3');

  // Dedicated Create Invoice Form
  const [invCustomerName, setInvCustomerName] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invItems, setInvItems] = useState('50 Crates of Large Eggs');
  const [invQuantity, setInvQuantity] = useState('50');
  const [invUnitPrice, setInvUnitPrice] = useState('4400');
  const [invDueDate, setInvDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [invStatus, setInvStatus] = useState('Unpaid');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
        setInvoices(data.invoices || []);
        setActiveBatches(data.batches || []);
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
    setCustomerName('');
    setType('Eggs');
    setQuantity('');
    setTotalAmount('');
    setPaymentMethod('Bank transfer');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setSelectedBatchId(activeBatches[0]?.id || 'b3');
  };

  const handleAddSale = async () => {
    if (!customerName || !quantity || !totalAmount) return;

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          type,
          quantity: Number(quantity),
          totalAmount: Number(totalAmount),
          paymentMethod,
          date: saleDate,
          batchId: selectedBatchId,
          status: 'Paid'
        })
      });

      if (res.ok) {
        toast.success('Sale recorded successfully');
        handleClose();
        refreshData();
      } else {
        toast.error('Failed to record sale');
      }
    } catch (_e) {
      toast.error('Error adding sale');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale transaction?')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sale deleted');
        refreshData();
      } else toast.error('Failed to delete sale');
    } catch (_e) { toast.error('Error deleting sale'); }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Delete this customer invoice?')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}&type=invoice`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Customer Invoice deleted successfully!');
        setInvoices(prev => prev.filter(i => i.id !== id));
        refreshData();
      } else toast.error('Failed to delete invoice');
    } catch (err) { console.error(err); }
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const linkUrl = `${window.location.origin}/pay-invoice/${inv.id}`;
    const text = `Official Farm Invoice #${inv.id}\nCustomer: ${inv.customerName}\nItem: ${inv.items}\nQty: ${inv.quantity}\nTotal Amount: ₦${inv.totalAmount.toLocaleString()}\nStatus: ${inv.status}\n\nPay Online or View Receipt here:\n${linkUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyPaymentLink = (inv: Invoice) => {
    const url = `${window.location.origin}/pay-invoice/${inv.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Paystack/Stripe online payment link copied to clipboard!');
  };

  const handleViewInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setOpenInvoiceView(true);
  };

  const handleCloseInvoiceView = () => {
    setOpenInvoiceView(false);
    setSelectedInvoice(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateInvoice = async () => {
    if (!invCustomerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    const qty = Number(invQuantity) || 1;
    const price = Number(invUnitPrice) || 0;
    const total = qty * price;

    try {
      toast.loading('Generating World-Class Invoice...', { id: 'inv-toast' });
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createInvoice',
          customerName: invCustomerName,
          items: invItems,
          quantity: qty,
          unitPrice: price,
          totalAmount: total,
          status: invStatus
        })
      });

      toast.dismiss('inv-toast');
      if (res.ok) {
        const data = await res.json();
        const createdInv = data.invoice;

        toast.success('World-Class Customer Invoice generated successfully!');
        setOpenInvoiceModal(false);
        setInvCustomerName('');
        setInvPhone('');
        setInvEmail('');

        await refreshData();

        // Immediately switch tab and open the generated invoice viewer with live payment link!
        setActiveTab('invoices');
        if (createdInv) {
          setSelectedInvoice(createdInv);
          setOpenInvoiceView(true);
        }
      } else {
        toast.error('Failed to create invoice');
      }
    } catch {
      toast.dismiss('inv-toast');
      toast.error('An error occurred while creating invoice');
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const avgSale = sales.length > 0 ? Math.round(totalSales / sales.length) : 0;
  const unpaidCount = invoices.filter(i => i.status !== 'Paid').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{TEXTS.sales.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{TEXTS.sales.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => {
              const columns = [
                { header: 'ID', key: 'id' },
                { header: 'Date', key: 'date' },
                { header: 'Customer', key: 'customerName' },
                { header: 'Items / Description', key: 'items' },
                { header: 'Quantity', key: 'quantity' },
                { header: 'Total Amount', key: 'totalAmount' },
                { header: 'Status', key: 'status' }
              ];
              printBrandedReport('Customer Invoices & Billing Audit', invoices, columns);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer size={16} /> Print Audit Report
          </button>
          <button 
            onClick={() => setOpenInvoiceModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <FileText size={16} /> + Generate New Invoice
          </button>
          <button 
            onClick={handleOpen}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus size={18} /> {TEXTS.sales.newSale}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'invoices' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={16} /> Customer Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('unpaid-invoices')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'unpaid-invoices' 
              ? 'border-amber-500 text-amber-700 bg-amber-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Coins size={16} className="text-amber-500" /> Unpaid & Pending ({unpaidCount})
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sales' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Sales History ({sales.length})
        </button>
      </div>

      {/* Tab 1: Customer Invoices */}
      {(activeTab === 'invoices' || activeTab === 'unpaid-invoices') && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              {activeTab === 'unpaid-invoices' ? 'Awaiting Payment Invoices' : 'All Merchant Invoices'}
            </CardTitle>
            <span className="text-xs text-slate-500 font-medium">Click any row to view full invoice & share payment links</span>
          </CardHeader>
          <CardContent className="p-6">
            <TableControls searchTerm={invoicesTable.searchTerm} setSearchTerm={invoicesTable.setSearchTerm} placeholder="Search by customer name, invoice ID..." />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold tracking-wider">
                  <tr>
                    <TableSortHeader label="Invoice ID" sortKey="id" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Date" sortKey="date" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Customer" sortKey="customerName" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Description / Items" sortKey="items" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Qty" sortKey="quantity" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Total Amount" sortKey="totalAmount" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Status" sortKey="status" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <th className="px-4 py-3 text-right">Actions / Payment Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoicesTable.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        No invoices found. Click <strong>+ Generate New Invoice</strong> to create your first customer invoice.
                      </td>
                    </tr>
                  ) : (
                    invoicesTable.data.map((inv) => (
                      <tr key={inv.id} className="hover:bg-indigo-50/40 transition-colors cursor-pointer" onClick={() => handleViewInvoice(inv)}>
                        <td className="px-4 py-3.5 font-bold font-mono text-indigo-600">#{inv.id}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono">{inv.date}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{inv.customerName}</td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{inv.items}</td>
                        <td className="px-4 py-3.5 text-slate-600 font-mono">{inv.quantity}</td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-900 font-mono">₦{inv.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            ● {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewInvoice(inv)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              onClick={() => handleCopyPaymentLink(inv)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                              title="Copy Online Payment Link"
                            >
                              <LinkIcon size={15} />
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(inv)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                              title="Share on WhatsApp"
                            >
                              <MessageSquare size={15} />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Delete Invoice"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={invoicesTable.currentPage}
              totalPages={invoicesTable.totalPages}
              pageSize={invoicesTable.pageSize}
              totalItems={invoicesTable.totalItems}
              onPageChange={invoicesTable.setCurrentPage}
              onPageSizeChange={invoicesTable.setPageSize}
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Sales History */}
      {activeTab === 'sales' && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>{TEXTS.sales.salesHistory}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TableControls searchTerm={salesTable.searchTerm} setSearchTerm={salesTable.setSearchTerm} placeholder="Search sales..." />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold tracking-wider">
                  <tr>
                    <TableSortHeader label="Sale ID" sortKey="id" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label="Date" sortKey="date" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label="Customer" sortKey="customerName" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label="Product Type" sortKey="type" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label="Amount" sortKey="totalAmount" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label="Payment Method" sortKey="paymentMethod" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label="Status" sortKey="status" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    {canEdit && <th className="px-4 py-3 text-right">Delete</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {salesTable.data.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900">#{sale.id}</td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono">{sale.date}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{sale.customerName}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-indigo-50 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 uppercase font-mono rounded">
                          {sale.type} ({sale.quantity} items)
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 font-mono">₦{sale.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-slate-600">{sale.paymentMethod}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {sale.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3.5 text-right">
                          <button onClick={() => handleDeleteSale(sale.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={salesTable.currentPage}
              totalPages={salesTable.totalPages}
              pageSize={salesTable.pageSize}
              totalItems={salesTable.totalItems}
              onPageChange={salesTable.setCurrentPage}
              onPageSizeChange={salesTable.setPageSize}
            />
          </CardContent>
        </Card>
      )}

      {/* 1. Record New Sale Modal */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden', m: { xs: 1, sm: 2 } } } }}
      >
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
              <Plus size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Record New Farm Sale</h3>
              <p className="text-xs text-indigo-200">Log immediate farm sales transaction to record revenue</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <DialogContent className="p-5 sm:p-6 space-y-4 bg-slate-50">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <TextField 
              label="Customer Name *" 
              placeholder="e.g. Iya Faruq Frozen / Walk-in Customer" 
              fullWidth 
              size="small"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormControl fullWidth size="small">
                <InputLabel>Product Type</InputLabel>
                <Select value={type} label="Product Type" onChange={(e) => setType(e.target.value)}>
                  <MenuItem value="Eggs">Eggs (Cracked / Fresh)</MenuItem>
                  <MenuItem value="Chickens">Chickens (Spent Layers / Broilers)</MenuItem>
                  <MenuItem value="Manure">Organic Manure / Fertilizer</MenuItem>
                  <MenuItem value="Feeds">Feed Inventory Resale</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Flock Batch</InputLabel>
                <Select value={selectedBatchId} label="Flock Batch" onChange={(e) => setSelectedBatchId(e.target.value)}>
                  {activeBatches.map(b => (
                    <MenuItem key={b.id} value={b.id}>{b.breed} ({b.id} - {b.quantity} birds)</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField 
                label="Quantity Sold *" 
                type="number"
                placeholder="e.g. 50" 
                size="small"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <TextField 
                label="Total Amount Received (₦) *" 
                type="number"
                placeholder="e.g. 225000" 
                size="small"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select value={paymentMethod} label="Payment Method" onChange={(e) => setPaymentMethod(e.target.value)}>
                  <MenuItem value="Bank transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="POS">POS Terminal</MenuItem>
                  <MenuItem value="Paystack">Paystack Online</MenuItem>
                </Select>
              </FormControl>

              <TextField 
                label="Sale Date" 
                type="date"
                size="small"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </div>
          </div>
        </DialogContent>

        <DialogActions className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2">
          <MuiButton onClick={handleClose} variant="text" sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={() => {
              if (!customerName || !quantity || !totalAmount) {
                toast.error('Please enter customer name, quantity, and total amount');
                return;
              }
              handleAddSale();
            }} 
            variant="contained" 
            sx={{ 
              bgcolor: '#0f172a', 
              '&:hover': { bgcolor: '#1e293b' }, 
              textTransform: 'none', 
              fontWeight: 700, 
              px: 3, 
              py: 1, 
              borderRadius: 2.5 
            }}
          >
            Save New Sale
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* 2. World-Class Executive Invoice Generator Modal */}
      <Dialog 
        open={openInvoiceModal} 
        onClose={() => setOpenInvoiceModal(false)} 
        fullWidth 
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden', m: { xs: 1, sm: 2 } } } }}
      >
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">World-Class Invoice Generator</h3>
              <p className="text-xs text-indigo-200">Create merchant customer invoices with instant online payment links</p>
            </div>
          </div>
          <button onClick={() => setOpenInvoiceModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <DialogContent className="p-5 sm:p-6 space-y-6 bg-slate-50">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Customer & Billing Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField 
                label="Customer / Business Name *" 
                placeholder="e.g. Maitama Supermarket Ltd" 
                fullWidth 
                size="small"
                value={invCustomerName}
                onChange={(e) => setInvCustomerName(e.target.value)}
              />
              <TextField 
                label="Customer Phone / WhatsApp" 
                placeholder="e.g. +234 803 123 4567" 
                fullWidth 
                size="small"
                value={invPhone}
                onChange={(e) => setInvPhone(e.target.value)}
              />
              <TextField 
                label="Customer Email" 
                placeholder="e.g. billing@maitama.com" 
                fullWidth 
                size="small"
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Line Items & Pricing</h4>
            <div className="space-y-4">
              <TextField 
                label="Invoice Items / Description *" 
                placeholder="e.g. 50 Crates of Large Eggs + Packaging" 
                fullWidth 
                size="small"
                value={invItems}
                onChange={(e) => setInvItems(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TextField 
                  label="Quantity *" 
                  type="number"
                  placeholder="50" 
                  size="small"
                  value={invQuantity}
                  onChange={(e) => setInvQuantity(e.target.value)}
                />

                <TextField 
                  label="Unit Price (₦) *" 
                  type="number"
                  placeholder="4400" 
                  size="small"
                  value={invUnitPrice}
                  onChange={(e) => setInvUnitPrice(e.target.value)}
                />

                <TextField 
                  label="Payment Due Date" 
                  type="date"
                  size="small"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">Total Invoice Amount</span>
                <span className="text-[11px] text-slate-500">Calculated based on quantity × unit price</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-650">
                ₦{(Number(invQuantity || 1) * Number(invUnitPrice || 0)).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Initial Payment Status</h4>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={invStatus} label="Status" onChange={(e) => setInvStatus(e.target.value)}>
                <MenuItem value="Unpaid">Unpaid (Generate Paystack Online Link)</MenuItem>
                <MenuItem value="Paid">Paid (Already Settled Offline)</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>

        <DialogActions className="p-4 bg-white border-t border-slate-200 flex justify-between items-center flex-wrap gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Generates a shareable Paystack online payment link.</span>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <MuiButton onClick={() => setOpenInvoiceModal(false)} variant="text" sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </MuiButton>
            <MuiButton 
              onClick={handleCreateInvoice} 
              variant="contained" 
              sx={{ 
                bgcolor: '#4f46e5', 
                '&:hover': { bgcolor: '#4338ca' }, 
                textTransform: 'none', 
                fontWeight: 700, 
                px: 3, 
                py: 1.2, 
                borderRadius: 2.5 
              }}
            >
              Generate & Open Invoice
            </MuiButton>
          </div>
        </DialogActions>
      </Dialog>

      {/* 3. Responsive Invoice Viewer Modal */}
      <Dialog 
        open={openInvoiceView} 
        onClose={handleCloseInvoiceView} 
        fullWidth 
        maxWidth="md" 
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden', m: { xs: 1, sm: 2 } } } }}
      >
        <DialogContent className="p-0 overflow-y-auto bg-slate-50">
          <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  Invoice #{selectedInvoice?.id}
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                    selectedInvoice?.status === 'Paid' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedInvoice?.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Issued on {selectedInvoice?.date}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={() => selectedInvoice && handleCopyPaymentLink(selectedInvoice)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Copy size={14} /> Copy Online Link
              </button>
              <button 
                onClick={() => selectedInvoice && handleShareWhatsApp(selectedInvoice)} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <MessageSquare size={14} /> Share WhatsApp
              </button>
              <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                <Printer size={14} /> Print PDF
              </button>
              <button onClick={handleCloseInvoiceView} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Shareable Online Payment Link Notice Banner */}
          {selectedInvoice && selectedInvoice.status !== 'Paid' && (
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-2 text-indigo-900 font-medium min-w-0">
                <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
                <span className="truncate">Shareable Online Payment Link: <strong className="font-mono text-indigo-700 truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/pay-invoice/{selectedInvoice.id}</strong></span>
              </div>
              <button 
                onClick={() => handleCopyPaymentLink(selectedInvoice)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={12} /> Copy Link
              </button>
            </div>
          )}

          {/* Printable Professional Invoice Body */}
          <div className="p-4 sm:p-8 md:p-12 bg-white text-slate-800 space-y-6 font-sans overflow-x-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6 sm:pb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-base shrink-0">
                    P
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 break-words">POULTRY FARM ENTERPRISE</h2>
                </div>
                <p className="text-xs text-slate-500">Official Merchant Invoice</p>
                <p className="text-xs text-slate-500">Support: billing@poultryfarm.com</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono block">INVOICE</span>
                <p className="text-xs font-bold text-indigo-600 font-mono mt-0.5">#{selectedInvoice?.id}</p>
                <p className="text-xs text-slate-500 mt-1">Date: <strong>{selectedInvoice?.date}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To:</span>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 break-words">{selectedInvoice?.customerName}</h4>
                <p className="text-slate-500 mt-1">Status: <strong className={selectedInvoice?.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{selectedInvoice?.status}</strong></p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Due Amount:</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-650">
                  ₦{selectedInvoice?.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[400px]">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-4 px-4 font-semibold text-slate-900 font-sans">{selectedInvoice?.items}</td>
                    <td className="py-4 px-4 text-center text-slate-600">{selectedInvoice?.quantity}</td>
                    <td className="py-4 px-4 text-right text-slate-600">₦{selectedInvoice?.unitPrice.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900">₦{selectedInvoice?.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-end">
              <MuiButton onClick={handleCloseInvoiceView} variant="outlined" sx={{ textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}>
                Close Preview
              </MuiButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
