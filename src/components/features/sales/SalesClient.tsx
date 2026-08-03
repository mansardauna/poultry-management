'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, ShoppingCart, Coins, BarChart2, FileText, MessageSquare, Printer, Trash2 } from 'lucide-react';
import { TEXTS } from "@/lib/constants/texts";
import { Sale, Invoice, ChickenBatch } from "@/data/types";
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

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const avgSale = sales.length > 0 ? Math.round(totalSales / sales.length) : 0;
  const paidSales = sales.filter(s => s.status === 'Paid').length;

  return (
    <div className="space-y-6">
      {/* Header and Action Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{TEXTS.sales.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{TEXTS.sales.subtitle}</p>
        </div>
        <button 
          onClick={handleOpen}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> {TEXTS.sales.newSale}
        </button>
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
                          <button 
                            onClick={() => handleCopyPaymentLink(inv)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold uppercase px-2 py-1 inline-flex items-center gap-1"
                          >
                            <Coins size={12} /> Pay Link
                          </button>
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
      <Dialog open={openInvoiceView} onClose={handleCloseInvoiceView} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogContent className="p-8 space-y-6 font-mono text-xs" id="printable-invoice">
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-4">
            <h2 className="text-lg font-semibold tracking-wider uppercase text-slate-800">POULTRY FARM</h2>
            <p className="text-[10px] text-slate-500">Maitama, Abuja</p>
            <p className="text-[10px] text-slate-400">Tel: +234 803 123 4567</p>
          </div>
          
          <div className="flex justify-between text-[11px]">
            <div>
              <p className="text-slate-400">INVOICE TO:</p>
              <p className="font-semibold text-slate-900">{selectedInvoice?.customerName}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">INVOICE: {selectedInvoice?.id}</p>
              <p className="text-slate-400">DATE: {selectedInvoice?.date}</p>
            </div>
          </div>

          <table className="w-full border-t border-b border-slate-200 py-2">
            <thead>
              <tr className="text-left font-semibold text-slate-700">
                <th className="py-2">Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit (₦)</th>
                <th className="py-2 text-right">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">{selectedInvoice?.items}</td>
                <td className="py-2 text-center">{selectedInvoice?.quantity}</td>
                <td className="py-2 text-right">₦{selectedInvoice?.unitPrice.toLocaleString()}</td>
                <td className="py-2 text-right font-semibold">₦{selectedInvoice?.totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-start pt-4 border-t border-dashed border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500">PAYMENT STATUS: <span className="font-semibold text-emerald-600">{selectedInvoice?.status}</span></p>
              <p className="text-[9px] text-slate-450 mt-1">Generated by Abdulrahman Monsur</p>
            </div>
            <div className="text-right font-semibold text-sm text-indigo-650">
              Total Due: ₦{selectedInvoice?.totalAmount.toLocaleString()}
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-4 flex gap-4 justify-center print:hidden">
            <button onClick={handlePrint} className="bg-slate-100 text-slate-750 px-3 py-1 flex items-center gap-1 font-semibold uppercase hover:bg-slate-200">
              <Printer size="12" /> Print PDF
            </button>
            <button onClick={() => selectedInvoice && handleShareWhatsApp(selectedInvoice)} className="bg-emerald-100 text-emerald-800 px-3 py-1 flex items-center gap-1 font-semibold uppercase hover:bg-emerald-200">
              <MessageSquare size={12} /> WhatsApp Share
            </button>
            <button onClick={handleCloseInvoiceView} className="bg-slate-200 text-slate-800 px-3 py-1 font-semibold uppercase hover:bg-slate-300">
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
