'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, ShoppingCart, Coins, BarChart2, FileText, MessageSquare, Printer, Trash2, X } from 'lucide-react';
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

/**
 * Props for the SalesClient component.
 */
interface SalesClientProps {
  initialSales: Sale[];
  initialInvoices: Invoice[];
  batches: ChickenBatch[];
  role?: string;
}

/**
 * SalesClient component for managing sales and invoices.
 * @param props The component props.
 */
export function SalesClient({ initialSales, initialInvoices, batches, role = 'Staff' }: SalesClientProps) {
  const canEdit = role === 'Admin';
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activeBatches, setActiveBatches] = useState<ChickenBatch[]>(batches);
  
  // Tabs for Sales vs Invoices
  const [activeTab, setActiveTab] = useState<'sales' | 'invoices' | 'unpaid-invoices'>('sales');

  const salesTable = useTableLogic({ 
    data: sales, 
    searchFields: ['customerName', 'type', 'paymentMethod', 'status'], 
    initialPageSize: 20 
  });

  const filteredInvoices = invoices.filter(inv => activeTab === 'unpaid-invoices' ? inv.status !== 'Paid' : inv.status === 'Paid');
  const invoicesTable = useTableLogic({ 
    data: filteredInvoices, 
    searchFields: ['customerName', 'id', 'status'], 
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
  const [invItems, setInvItems] = useState('10 Crates of Large Eggs');
  const [invQuantity, setInvQuantity] = useState('10');
  const [invUnitPrice, setInvUnitPrice] = useState('4400');
  const [invStatus, setInvStatus] = useState('Unpaid');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
        setInvoices(data.invoices);
        setActiveBatches(data.batches);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Quick Load Sales Preset Templates
  const handleApplyPreset = (preset: 'small' | 'large') => {
    if (preset === 'small') {
      setCustomerName('Wholesale Buyer');
      setType('Eggs');
      setQuantity('90'); // 3 crates * 30 eggs
      setTotalAmount('12600'); // 3 * 4200
    } else {
      setCustomerName('Wholesale Buyer');
      setType('Eggs');
      setQuantity('60'); // 2 crates * 30 eggs
      setTotalAmount('8800'); // 2 * 4400
    }
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
        refreshData();
        handleClose();
        toast.success('Sale recorded! Invoice auto-generated.');
      } else {
        toast.error('Failed to record sale');
      }
    } catch (err) {
      console.error(err);
    }
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

  const handleDeleteSale = async (id: string) => {
    if (!confirm('Delete this sale record? The linked invoice will remain.')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Sale deleted.'); }
      else toast.error('Failed to delete sale');
    } catch (err) { console.error(err); }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}&type=invoice`, { method: 'DELETE' });
      if (res.ok) { refreshData(); toast.success('Invoice deleted.'); }
      else toast.error('Failed to delete invoice');
    } catch (err) { console.error(err); }
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const text = `Farm Invoice ${inv.id}\nCustomer: ${inv.customerName}\nItem: ${inv.items}\nQty: ${inv.quantity}\nTotal: ₦${inv.totalAmount.toLocaleString()}\nStatus: ${inv.status}\nThank you for your patronage!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyPaymentLink = (inv: Invoice) => {
    const url = `${window.location.origin}/pay-invoice/${inv.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Payment link copied to clipboard!');
  };

  const handleUpdateInvoiceStatus = async (invId: string, newStatus: string) => {
    try {
      toast.loading('Updating invoice status...', { id: 'status-toast' });
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateInvoiceStatus', id: invId, status: newStatus })
      });
      toast.dismiss('status-toast');
      if (res.ok) {
        toast.success(newStatus === 'Paid' ? 'Invoice marked as Paid! Automatically added to Completed Sales.' : 'Invoice status updated.');
        refreshData();
        if (selectedInvoice && selectedInvoice.id === invId) {
          setSelectedInvoice({ ...selectedInvoice, status: newStatus });
        }
      } else {
        toast.error('Failed to update invoice status');
      }
    } catch (_e) {
      toast.dismiss('status-toast');
      toast.error('Error updating invoice status');
    }
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
      toast.loading('Generating invoice...', { id: 'inv-toast' });
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createInvoice',
          customerName: invCustomerName.trim(),
          items: invItems,
          quantity: qty,
          unitPrice: price,
          totalAmount: total,
          status: invStatus
        })
      });

      toast.dismiss('inv-toast');
      if (res.ok) {
        toast.success('Customer Invoice generated successfully!');
        setOpenInvoiceModal(false);
        setInvCustomerName('');
        refreshData();
      } else {
        toast.error('Failed to create invoice');
      }
    } catch {
      toast.dismiss('inv-toast');
      toast.error('An error occurred');
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const avgSale = sales.length > 0 ? Math.round(totalSales / sales.length) : 0;
  const paidSales = sales.filter(s => s.status === 'Paid').length;

  return (
    <div className="space-y-6">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{TEXTS.sales.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{TEXTS.sales.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const columns = [
                { header: 'Sale ID', key: 'id' },
                { header: 'Date', key: 'date' },
                { header: 'Customer Name', key: 'customerName' },
                { header: 'Product Type', key: 'type' },
                { header: 'Quantity', key: 'quantity' },
                { header: 'Total Amount', key: 'totalAmount' },
                { header: 'Payment Method', key: 'paymentMethod' },
                { header: 'Status', key: 'status' }
              ];
              printBrandedReport('Sales & Revenue Operations Audit', sales, columns);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer size={16} /> Print Report
          </button>
          <button 
            onClick={() => setOpenInvoiceModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileText size={16} /> + Create New Invoice
          </button>
          <button 
            onClick={handleOpen}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus size={18} /> {TEXTS.sales.newSale}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sales')}
          className={`py-2 px-4 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'sales' 
              ? 'border-indigo-600 text-indigo-650' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Sales Transactions
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-2 px-4 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'invoices' 
              ? 'border-indigo-600 text-indigo-650' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={16} /> Paid Invoices ({invoices.filter(i => i.status === 'Paid').length})
        </button>
        <button
          onClick={() => setActiveTab('unpaid-invoices' as any)}
          className={`py-2 px-4 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'unpaid-invoices' 
              ? 'border-red-500 text-red-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={16} /> Unpaid Invoices ({invoices.filter(i => i.status !== 'Paid').length})
        </button>
      </div>

      {activeTab === 'sales' ? (
        <>
          {/* Overview Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{TEXTS.sales.totalRevenue}</p>
                    <p className="text-3xl font-semibold text-indigo-600 mt-2">₦{totalSales.toLocaleString()}</p>
                  </div>
                  <div className="text-indigo-655">
                    <ShoppingCart size={32} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-3">{sales.length} transactions recorded</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Sales</p>
                    <p className="text-3xl font-semibold text-emerald-600 mt-2">{paidSales}</p>
                  </div>
                  <div className="text-emerald-500">
                    <BarChart2 size={32} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-3 font-semibold">{sales.length - paidSales} pending payment</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Sale Value</p>
                    <p className="text-3xl font-semibold text-slate-800 mt-2">₦{avgSale.toLocaleString()}</p>
                  </div>
                  <div className="text-amber-500">
                    <Coins size={32} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-3 font-semibold">Per transaction average</div>
              </CardContent>
            </Card>
          </div>

          {/* Sales History Table */}
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle>{TEXTS.sales.salesHistory}</CardTitle>
            </CardHeader>
            <CardContent>
              <TableControls searchTerm={salesTable.searchTerm} setSearchTerm={salesTable.setSearchTerm} placeholder="Search sales..." />
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <TableSortHeader label="Sale ID" sortKey="id" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                      <TableSortHeader label="Date" sortKey="date" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                      <TableSortHeader label="Customer" sortKey="customerName" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                      <TableSortHeader label="Product Type" sortKey="type" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                      <TableSortHeader label="Amount" sortKey="totalAmount" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                      <TableSortHeader label="Payment Method" sortKey="paymentMethod" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                      <TableSortHeader label="Status" sortKey="status" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                      {canEdit && <th className="px-4 py-3">Del</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesTable.data.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{sale.id}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{sale.date}</td>
                        <td className="px-4 py-3 font-medium text-slate-850">{sale.customerName}</td>
                        <td className="px-4 py-3">
                          <span className="bg-indigo-50 text-indigo-800 text-[10px] font-semibold px-2 py-0.5 uppercase font-mono">
                            {sale.type} ({sale.quantity} items)
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">₦{sale.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500 font-medium">{sale.paymentMethod}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 uppercase ${
                            sale.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteSale(sale.id)} className="p-1 hover:bg-red-100 rounded" title="Delete">
                              <Trash2 size={13} className="text-red-500" />
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
                totalItems={salesTable.totalItems}
                pageSize={salesTable.pageSize}
                onPageChange={salesTable.setCurrentPage}
                onPageSizeChange={salesTable.setPageSize}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        /* Invoices List view */
        <Card>
          <CardHeader>
            <CardTitle>{activeTab === 'unpaid-invoices' ? 'Unpaid Customer Invoices' : 'Paid Customer Invoices'}</CardTitle>
          </CardHeader>
          <CardContent>
            <TableControls searchTerm={invoicesTable.searchTerm} setSearchTerm={invoicesTable.setSearchTerm} placeholder="Search invoices..." />
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <TableSortHeader label="Invoice ID" sortKey="id" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Date" sortKey="date" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Customer" sortKey="customerName" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Items Sold" sortKey="items" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Total Amount" sortKey="totalAmount" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label="Status" sortKey="status" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <th className="px-4 py-3 text-right">Actions</th>
                    {canEdit && <th className="px-4 py-3 text-right">Del</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {invoicesTable.data.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{inv.id}</td>
                      <td className="px-4 py-3 text-slate-400">{inv.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{inv.customerName}</td>
                      <td className="px-4 py-3 text-slate-600">{inv.items} ({inv.quantity} units)</td>
                      <td className="px-4 py-3 font-semibold text-indigo-650">₦{inv.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button 
                          onClick={() => handleViewInvoice(inv)}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-semibold uppercase px-2 py-1"
                        >
                          View Printable
                        </button>
                        <button 
                          onClick={() => handleShareWhatsApp(inv)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-semibold uppercase px-2 py-1 inline-flex items-center gap-1"
                        >
                          <MessageSquare size={12} /> Share
                        </button>
                        {inv.status !== 'Paid' && (
                          <>
                            <button 
                              onClick={() => handleCopyPaymentLink(inv)}
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold uppercase px-2 py-1 inline-flex items-center gap-1"
                            >
                              <Coins size={12} /> Pay Link
                            </button>
                            <button 
                              onClick={() => handleUpdateInvoiceStatus(inv.id, 'Paid')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase px-2 py-1 inline-flex items-center gap-1 shadow-sm"
                            >
                              ✓ Mark as Paid
                            </button>
                          </>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1 hover:bg-red-100 rounded" title="Delete">
                            <Trash2 size={13} className="text-red-500" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination 
              currentPage={invoicesTable.currentPage}
              totalPages={invoicesTable.totalPages}
              totalItems={invoicesTable.totalItems}
              pageSize={invoicesTable.pageSize}
              onPageChange={invoicesTable.setCurrentPage}
              onPageSizeChange={invoicesTable.setPageSize}
            />
          </CardContent>
        </Card>
      )}

      {/* New Sale Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 600 }}>Record New Sale</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          
          {/* Quick Presets */}
          <div className="p-3 bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Apply Crate Presets:</p>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => handleApplyPreset('small')}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-semibold uppercase px-3 py-1.5 transition-colors"
              >
                Small Crate Template (₦4,200)
              </button>
              <button 
                type="button"
                onClick={() => handleApplyPreset('large')}
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[10px] font-semibold uppercase px-3 py-1.5 transition-colors"
              >
                Premium Large Template (₦4,400)
              </button>
            </div>
          </div>

          <TextField
            label="Sale Date"
            type="date"
            fullWidth
            variant="outlined"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } }, inputLabel: { shrink: true } }}
          />
          <TextField
            label="Customer / Buyer Details"
            fullWidth
            variant="outlined"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Product Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              label="Product Type"
              className="rounded-sm"
            >
              <MenuItem value="Eggs">Eggs</MenuItem>
              <MenuItem value="Chickens">Chickens (Live Birds)</MenuItem>
              <MenuItem value="Feed">Feed</MenuItem>
            </Select>
          </FormControl>
          
          {type === 'Chickens' && (
            <FormControl fullWidth variant="outlined">
              <InputLabel>Select Batch to Deduct Birds From</InputLabel>
              <Select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                label="Select Batch to Deduct Birds From"
                className="rounded-sm"
              >
                {activeBatches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.id} ({b.breed} - {b.quantity} birds in {b.farmSection})</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Quantity (Items / Eggs count)"
            type="number"
            fullWidth
            variant="outlined"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <TextField
            label="Total Price Amount (₦)"
            type="number"
            fullWidth
            variant="outlined"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            slotProps={{ htmlInput: { sx: { borderRadius: 2 } } }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Payment Channel</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Payment Channel"
              className="rounded-sm"
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Bank transfer">Bank transfer</MenuItem>
              <MenuItem value="POS">POS</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleClose} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleAddSale} 
            variant="contained" 
            disabled={!customerName || !quantity || !totalAmount}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Record Sale
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Invoice Viewer Modal */}
      <Dialog open={openInvoiceView} onClose={handleCloseInvoiceView} fullWidth maxWidth="md" slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
        <DialogContent className="p-0 overflow-y-auto bg-slate-50" id="printable-invoice">
          {/* Top Bar with Status and Quick Actions */}
          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Invoice {selectedInvoice?.id}
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

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {selectedInvoice?.status !== 'Paid' && (
                <>
                  <button 
                    onClick={() => selectedInvoice && handleCopyPaymentLink(selectedInvoice)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Coins size={14} /> Paystack Online Link
                  </button>
                  <button 
                    onClick={async () => {
                      if (!selectedInvoice) return;
                      try {
                        const res = await fetch('/api/sales', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: selectedInvoice.id, status: 'Paid', type: 'invoice' })
                        });
                        if (res.ok) {
                          toast.success('Invoice marked as Paid!');
                          setSelectedInvoice({ ...selectedInvoice, status: 'Paid' });
                          refreshData();
                        }
                      } catch (_e) { toast.error('Failed to update status'); }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    Mark as Paid (Offline)
                  </button>
                </>
              )}
              <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition-all flex items-center gap-1.5">
                <Printer size={14} /> Print / PDF
              </button>
              <button onClick={() => selectedInvoice && handleShareWhatsApp(selectedInvoice)} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium px-3 py-2 rounded-lg transition-all flex items-center gap-1.5">
                <MessageSquare size={14} /> WhatsApp
              </button>
            </div>
          </div>

          {/* Printable Professional Invoice Body */}
          <div className="p-8 sm:p-12 bg-white text-slate-800 space-y-8 font-sans">
            {/* Header / Farm Branding */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-base">
                    P
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">POULTRY FARM ENTERPRISE</h2>
                </div>
                <p className="text-xs text-slate-500">Maitama Agriculture Hub, Abuja, FCT</p>
                <p className="text-xs text-slate-500">Phone: +234 803 123 4567 | Email: billing@poultryfarm.com</p>
              </div>

              <div className="text-right">
                <h1 className="text-3xl font-extrabold uppercase tracking-widest text-slate-300">INVOICE</h1>
                <p className="text-sm font-mono font-bold text-slate-800 mt-1">#{selectedInvoice?.id}</p>
                <p className="text-xs text-slate-500 mt-0.5">Date: {selectedInvoice?.date}</p>
              </div>
            </div>

            {/* Billed To / Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">BILLED TO</span>
                <p className="font-semibold text-slate-900 text-sm">{selectedInvoice?.customerName}</p>
                <p className="text-slate-500">Verified Customer</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">PAYMENT STATUS</span>
                <span className={`inline-flex items-center gap-1 font-bold text-xs ${selectedInvoice?.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  ● {selectedInvoice?.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">PAYMENT METHOD</span>
                <p className="font-medium text-slate-700">Bank Transfer / Paystack</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Unit Price (₦)</th>
                    <th className="py-3 px-4 text-right">Total Amount (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-4 px-4 font-semibold text-slate-900">{selectedInvoice?.items}</td>
                    <td className="py-4 px-4 text-center font-mono">{selectedInvoice?.quantity}</td>
                    <td className="py-4 px-4 text-right font-mono">₦{selectedInvoice?.unitPrice.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">₦{selectedInvoice?.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="flex justify-between items-end pt-4">
              <div className="max-w-xs text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">Terms & Conditions:</p>
                <p>Payment is due within 7 days. Thank you for doing business with us!</p>
              </div>

              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">₦{selectedInvoice?.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
                  <span>Tax / VAT (0%):</span>
                  <span className="font-mono">₦0.00</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                  <span>Total Due:</span>
                  <span className="font-mono text-indigo-600">₦{selectedInvoice?.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer / Sign-off */}
            <div className="border-t border-dashed border-slate-200 pt-6 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
              <p>© {new Date().getFullYear()} Poultry Farm Management System. All rights reserved.</p>
              <p className="font-mono">Ref: {selectedInvoice?.id}-VERIFIED</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dedicated Create Invoice Dialog */}
      <Dialog 
        open={openInvoiceModal} 
        onClose={() => setOpenInvoiceModal(false)}
        fullWidth 
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
      >
        <DialogTitle className="bg-slate-900 text-white font-bold text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-400" /> Create Customer Invoice
          </span>
          <button onClick={() => setOpenInvoiceModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </DialogTitle>

        <DialogContent className="p-6 space-y-4">
          <p className="text-xs text-slate-500 mb-2">
            Generate an official invoice for egg, bird, or manure orders. Unpaid invoices generate Paystack payment links.
          </p>

          <TextField 
            label="Customer Name / Business" 
            placeholder="e.g. Maitama Supermarket Ltd" 
            fullWidth 
            size="small"
            value={invCustomerName}
            onChange={(e) => setInvCustomerName(e.target.value)}
          />

          <TextField 
            label="Invoice Items / Description" 
            placeholder="e.g. 50 Crates of Large Eggs" 
            fullWidth 
            size="small"
            value={invItems}
            onChange={(e) => setInvItems(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField 
              label="Quantity" 
              type="number"
              placeholder="10" 
              size="small"
              value={invQuantity}
              onChange={(e) => setInvQuantity(e.target.value)}
            />

            <TextField 
              label="Unit Price (₦)" 
              type="number"
              placeholder="4400" 
              size="small"
              value={invUnitPrice}
              onChange={(e) => setInvUnitPrice(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Calculated Invoice Total:</span>
            <span className="text-lg font-mono font-extrabold text-indigo-600">
              ₦{(Number(invQuantity || 1) * Number(invUnitPrice || 0)).toLocaleString()}
            </span>
          </div>

          <FormControl fullWidth size="small">
            <InputLabel>Initial Invoice Status</InputLabel>
            <Select value={invStatus} label="Initial Invoice Status" onChange={(e) => setInvStatus(e.target.value)}>
              <MenuItem value="Unpaid">Unpaid (Awaiting Payment)</MenuItem>
              <MenuItem value="Sent">Sent (Link Shared)</MenuItem>
              <MenuItem value="Paid">Paid (Already Settled)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <MuiButton onClick={() => setOpenInvoiceModal(false)} variant="text" sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </MuiButton>
          <MuiButton onClick={handleCreateInvoice} variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', fontWeight: 600, px: 3, py: 1, borderRadius: 2 }}>
            Generate & Save Invoice
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
