'use strict';
'use client';

import { useState, useEffect } from 'react';
import { useTableLogic } from '@/hooks/useTableLogic';
import { TableControls } from '@/components/ui/TableControls';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableSortHeader } from '@/components/ui/TableSortHeader';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Plus, 
  Coins, 
  FileText, 
  MessageSquare, 
  Printer, 
  Trash2, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  Clock
} from 'lucide-react';
import { useLanguage } from '@/components/features/LanguageContext';
import { Sale, Invoice, ChickenBatch } from "@/data/types";
import { printBrandedReport, printInvoiceReceipt } from '@/lib/exportReports';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useWorkspace } from '@/components/features/WorkspaceContext';
import { useWhiteLabel } from '@/components/features/WhiteLabelContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface SalesClientProps {
  initialSales: Sale[];
  initialInvoices: Invoice[];
  batches: ChickenBatch[];
  role?: string;
}

export function SalesClient({ initialSales, initialInvoices, batches, role = 'Staff' }: SalesClientProps) {
  const { texts, t } = useLanguage();
  const { confirm } = useConfirm();
  const { activeWorkspace } = useWorkspace();
  const whiteLabel = useWhiteLabel();
  const farmName = activeWorkspace?.name || whiteLabel?.coopName || 'Poultry Farm Enterprise';
  const farmType = activeWorkspace?.type || 'Layer & Broiler Operations';
  const farmEmail = 'billing@poultryfarm.com';
  const farmPhone = '+234 800 000 0000';
  const currencySymbol = whiteLabel?.currencySymbol || '$';

  const canEdit = role === 'Admin';
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activeBatches, setActiveBatches] = useState<ChickenBatch[]>(batches);
  
  // Navigation tabs: 'invoices', 'unpaid-invoices', 'paid-invoices', 'sales'
  const [activeTab, setActiveTab] = useState<'invoices' | 'sales' | 'unpaid-invoices' | 'paid-invoices'>('invoices');

  const salesTable = useTableLogic({ 
    data: sales, 
    searchFields: ['customerName', 'type', 'paymentMethod', 'status'], 
    initialPageSize: 20 
  });

  const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
  const unpaidCount = invoices.filter(inv => inv.status !== 'Paid').length;

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'unpaid-invoices') return inv.status !== 'Paid';
    if (activeTab === 'paid-invoices') return inv.status === 'Paid';
    return true; // Show ALL invoices on main invoices tab
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
    } catch {}
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
        const resData = await res.json();
        const created = resData.sale || resData;
        const createdInv = resData.invoice;

        if (created && created.id) {
          const normSale: Sale = {
            id: String(created.id),
            date: created.date || saleDate,
            type: String(created.type || type),
            quantity: Number(created.quantity) || Number(quantity) || 0,
            totalAmount: Number(created.totalAmount) || Number(totalAmount) || 0,
            customerName: String(created.customerName || customerName),
            paymentMethod: String(created.paymentMethod || paymentMethod),
            status: String(created.status || 'Paid')
          };
          setSales((prev) => [normSale, ...prev.filter((s) => s.id !== normSale.id)]);
        }

        if (createdInv && createdInv.id) {
          const normInv: Invoice = {
            id: String(createdInv.id),
            date: createdInv.date || saleDate,
            saleId: String(createdInv.saleId || (created?.id || '')),
            customerName: String(createdInv.customerName || customerName),
            items: String(createdInv.items || `${type} Crate / Batch Sale`),
            quantity: Number(createdInv.quantity) || Number(quantity) || 0,
            unitPrice: Number(createdInv.unitPrice) || 0,
            totalAmount: Number(createdInv.totalAmount) || Number(totalAmount) || 0,
            status: String(createdInv.status || 'Paid')
          };
          setInvoices((prev) => [normInv, ...prev.filter((i) => i.id !== normInv.id)]);
        }

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
    if (!await confirm(t('Are you sure you want to delete this sale transaction?', 'Are you sure you want to delete this sale transaction?'))) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sale deleted');
        setSales((prev) => prev.filter((s) => s.id !== id));
        refreshData();
      } else toast.error('Failed to delete sale');
    } catch (_e) { toast.error('Error deleting sale'); }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!await confirm(t('Delete this customer invoice?', 'Delete this customer invoice?'))) return;
    try {
      const res = await fetch(`/api/sales?id=${id}&type=invoice`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Customer Invoice deleted successfully!');
        setInvoices(prev => prev.filter(i => i.id !== id));
        refreshData();
      } else toast.error('Failed to delete invoice');
    } catch {}
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const linkUrl = `${window.location.origin}/pay-invoice/${inv.id}`;
    const text = `Official Farm Invoice #${inv.id}\nCustomer: ${inv.customerName}\nItem: ${inv.items}\nQty: ${inv.quantity}\nTotal Amount: ${currencySymbol}${inv.totalAmount.toLocaleString()}\nStatus: ${inv.status}\n\nPay Online or View Receipt here:\n${linkUrl}`;
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
    if (selectedInvoice) {
      printInvoiceReceipt(selectedInvoice, farmName);
    } else {
      window.print();
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, newStatus: string) => {
    try {
      toast.loading(`Updating invoice status to ${newStatus}...`, { id: 'status-toast' });
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateInvoiceStatus',
          id,
          status: newStatus
        })
      });
      toast.dismiss('status-toast');
      if (res.ok) {
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice({ ...selectedInvoice, status: newStatus });
        }
        toast.success(`Invoice marked as ${newStatus}!`);
        // Automatically switch to the right tab
        if (newStatus === 'Paid') {
          setActiveTab('paid-invoices');
        } else if (newStatus === 'Unpaid' || newStatus === 'Pending' || newStatus === 'Overdue') {
          setActiveTab('unpaid-invoices');
        }
        refreshData();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.dismiss('status-toast');
      toast.error('Error updating status');
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
        const createdInv = data.invoice || data;

        if (createdInv && createdInv.id) {
          const normInv: Invoice = {
            id: String(createdInv.id),
            date: createdInv.date || new Date().toISOString().split('T')[0],
            saleId: String(createdInv.saleId || ''),
            customerName: String(createdInv.customerName || invCustomerName),
            items: String(createdInv.items || invItems),
            quantity: Number(createdInv.quantity) || qty,
            unitPrice: Number(createdInv.unitPrice) || price,
            totalAmount: Number(createdInv.totalAmount) || total,
            status: String(createdInv.status || invStatus || 'Unpaid')
          };
          setInvoices((prev) => [normInv, ...prev.filter((i) => i.id !== normInv.id)]);
        }

        toast.success('World-Class Customer Invoice generated successfully!');
        setOpenInvoiceModal(false);
        setInvCustomerName('');
        setInvPhone('');
        setInvEmail('');

        refreshData();

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

  const totalSales = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const _avgSale = sales.length > 0 ? Math.round(totalSales / sales.length) : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{texts.sales?.title || t("Sales & Invoices")}</h1>
          <p className="text-sm text-slate-500 mt-1">{texts.sales?.subtitle || t("Track all farm sales and generate invoices.")}</p>
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
            <Printer size={16} /> {t("Print Audit Report")}
          </button>
          <button 
            onClick={() => setOpenInvoiceModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <FileText size={16} /> + {t("Generate New Invoice")}
          </button>
          <button 
            onClick={handleOpen}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus size={18} /> {texts.sales?.newSale || t("New Sale")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'invoices' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={16} /> {t("All Invoices")} ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('unpaid-invoices')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'unpaid-invoices' 
              ? 'border-amber-500 text-amber-700 bg-amber-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Coins size={16} className="text-amber-500" /> {t("Unpaid & Due")} ({unpaidCount})
        </button>
        <button
          onClick={() => setActiveTab('paid-invoices')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'paid-invoices' 
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 size={16} className="text-emerald-500" /> {t("Paid Invoices")} ({paidCount})
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sales' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {texts.sales?.salesHistory || t("Sales History")} ({sales.length})
        </button>
      </div>

      {/* Tab 1: Customer Invoices */}
      {(activeTab === 'invoices' || activeTab === 'unpaid-invoices' || activeTab === 'paid-invoices') && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              {activeTab === 'unpaid-invoices' ? t('Awaiting Payment Invoices') : activeTab === 'paid-invoices' ? t('Settled & Paid Invoices') : t('All Merchant Invoices')}
            </CardTitle>
            <span className="text-xs text-slate-500 font-medium">{t("Click any row to view full invoice & share payment links")}</span>
          </CardHeader>
          <CardContent className="p-6">
            <TableControls searchTerm={invoicesTable.searchTerm} setSearchTerm={invoicesTable.setSearchTerm} placeholder={t("Search by customer name, invoice ID...")} />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold tracking-wider">
                  <tr>
                    <TableSortHeader label={t("Invoice ID")} sortKey="id" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label={t("Date")} sortKey="date" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label={t("Customer")} sortKey="customerName" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label={t("Description / Items")} sortKey="items" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label={t("Qty")} sortKey="quantity" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label={t("Total Amount")} sortKey="totalAmount" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <TableSortHeader label={t("Status")} sortKey="status" currentSort={invoicesTable.sortConfig} onSort={invoicesTable.handleSort} />
                    <th className="px-4 py-3 text-right">{t("Actions / Payment Link")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoicesTable.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        {t("No invoices found.")} {t("Click")} <strong>+ {t("Generate New Invoice")}</strong> {t("to create your first customer invoice.")}
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
                        <td className="px-4 py-3.5 font-extrabold text-slate-900 font-mono">{currencySymbol}{inv.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            ● {t(inv.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== 'Paid' && (
                              <button
                                onClick={() => handleUpdateInvoiceStatus(inv.id, 'Paid')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-emerald-200 shrink-0"
                                title={t("Mark as Paid")}
                              >
                                {t("Mark Paid")}
                              </button>
                            )}
                            <button
                              onClick={() => handleViewInvoice(inv)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title={t("View Invoice")}
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              onClick={() => handleCopyPaymentLink(inv)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                              title={t("Copy Online Payment Link")}
                            >
                              <LinkIcon size={15} />
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(inv)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                              title={t("Share on WhatsApp")}
                            >
                              <MessageSquare size={15} />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title={t("Delete Invoice")}
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
            <CardTitle>{texts.sales?.salesHistory || t("Sales History")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <TableControls searchTerm={salesTable.searchTerm} setSearchTerm={salesTable.setSearchTerm} placeholder={t("Search sales...")} />
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-semibold tracking-wider">
                  <tr>
                    <TableSortHeader label={t("Sale ID")} sortKey="id" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label={t("Date")} sortKey="date" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label={t("Customer")} sortKey="customerName" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label={t("Product Type")} sortKey="type" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label={t("Amount")} sortKey="totalAmount" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label={t("Payment Method")} sortKey="paymentMethod" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    <TableSortHeader label={t("Status")} sortKey="status" currentSort={salesTable.sortConfig} onSort={salesTable.handleSort} />
                    {canEdit && <th className="px-4 py-3 text-right">{t("Delete")}</th>}
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
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 font-mono">{currencySymbol}{sale.totalAmount.toLocaleString()}</td>
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

      {/* 1. Record New Farm Sale Modal */}
      <Modal
        isOpen={open}
        onClose={handleClose}
        title={t("Record New Farm Sale")}
        subtitle={`${t("Log an immediate commercial sales transaction for")} ${farmName}`}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!customerName.trim() || !quantity || !totalAmount) {
              toast.error(t("Please enter customer name, quantity, and total amount"));
              return;
            }
            handleAddSale();
          }}
          className="space-y-4 font-sans"
        >
          <Input
            label={t("Customer Name / Business *")}
            placeholder={t("e.g. John Doe / City Hotel")}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t("Product Type")}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="Eggs">{t("Eggs (Cracked / Fresh)")}</option>
              <option value="Chickens">{t("Chickens (Spent Layers / Broilers)")}</option>
              <option value="Manure">{t("Organic Manure / Fertilizer")}</option>
              <option value="Feeds">{t("Feed Inventory Resale")}</option>
            </Select>

            <Select
              label={t("Flock Batch")}
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              {activeBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.breed} ({b.id} - {b.quantity} {t("birds")})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("Quantity Sold *")}
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />

            <Input
              label={`${t("Total Amount Received")} (${currencySymbol}) *`}
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 225000"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t("Payment Method")}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Bank transfer">{t("Bank Transfer")}</option>
              <option value="Cash">{t("Cash")}</option>
              <option value="POS">{t("POS Terminal")}</option>
              <option value="Paystack">{t("Paystack Online")}</option>
            </Select>

            <Input
              label={t("Sale Date")}
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("Save New Sale")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. World-Class Executive Invoice Generator Modal */}
      <Modal
        isOpen={openInvoiceModal}
        onClose={() => setOpenInvoiceModal(false)}
        title={t("Generate Commercial Invoice")}
        subtitle={`${t("Issue an authentic merchant invoice on behalf of")} ${farmName}`}
        size="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateInvoice();
          }}
          className="space-y-5 font-sans"
        >
          {/* Section 1: Customer Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{t("Customer & Billing Details")}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t("Customer / Business Name *")}
                placeholder="e.g. Maitama Supermarket Ltd"
                value={invCustomerName}
                onChange={(e) => setInvCustomerName(e.target.value)}
                required
              />
              <Input
                label={t("Customer Phone / WhatsApp")}
                placeholder="e.g. +234 803 123 4567"
                value={invPhone}
                onChange={(e) => setInvPhone(e.target.value)}
              />
              <Input
                label={t("Customer Email")}
                type="email"
                placeholder="e.g. billing@maitama.com"
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Items & Pricing */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{t("Line Items & Pricing")}</h4>
            </div>
            
            <Input
              label={t("Invoice Items / Description *")}
              placeholder="e.g. 50 Crates of Large Eggs + Packaging"
              value={invItems}
              onChange={(e) => setInvItems(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t("Quantity *")}
                type="number"
                min="1"
                placeholder="50"
                value={invQuantity}
                onChange={(e) => setInvQuantity(e.target.value)}
                required
              />
              <Input
                label={`${t("Unit Price")} (${currencySymbol}) *`}
                type="number"
                min="0"
                step="any"
                placeholder="4400"
                value={invUnitPrice}
                onChange={(e) => setInvUnitPrice(e.target.value)}
                required
              />
              <Input
                label={t("Payment Due Date")}
                type="date"
                value={invDueDate}
                onChange={(e) => setInvDueDate(e.target.value)}
              />
            </div>

            <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">{t("Total Invoice Valuation")}</span>
                <span className="text-[11px] text-slate-500">{t("Calculated as Quantity × Unit Price")}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700">
                {currencySymbol}{(Number(invQuantity || 1) * Number(invUnitPrice || 0)).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Section 3: Status */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">3</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{t("Initial Payment Status")}</h4>
            </div>
            <Select
              value={invStatus}
              onChange={(e) => setInvStatus(e.target.value)}
            >
              <option value="Unpaid">{t("Unpaid (Generate Paystack/Online Checkout Link)")}</option>
              <option value="Paid">{t("Paid (Already Settled Offline via Cash/Bank Transfer)")}</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {t("Generates an official record with live payment link and PDF generation.")}
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button variant="secondary" onClick={() => setOpenInvoiceModal(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" variant="primary" leftIcon={<FileText size={16} />}>
                {t("Generate & Issue Invoice")}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 3. World-Class Authentic Invoice Viewer Modal */}
      <Modal
        isOpen={openInvoiceView}
        onClose={handleCloseInvoiceView}
        title={`${t("Commercial Invoice")} #${selectedInvoice?.id || ''}`}
        subtitle={`${t("Issued by")} ${farmName} • ${t("Status")}: ${t(selectedInvoice?.status || 'Unpaid')}`}
        size="2xl"
      >
        <div className="space-y-6 font-sans">
          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                selectedInvoice?.status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {selectedInvoice?.status === 'Paid' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                {t(selectedInvoice?.status || 'Unpaid')}
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                {t("Issued")} {selectedInvoice?.date}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Copy size={13} />}
                onClick={() => selectedInvoice && handleCopyPaymentLink(selectedInvoice)}
              >
                {t("Copy Link")}
              </Button>
              <Button
                variant="success"
                size="sm"
                leftIcon={<MessageSquare size={13} />}
                onClick={() => selectedInvoice && handleShareWhatsApp(selectedInvoice)}
              >
                {t("WhatsApp")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer size={13} />}
                onClick={handlePrint}
              >
                {t("Print PDF")}
              </Button>
            </div>
          </div>

          {/* Shareable Online Payment Link Notice Banner */}
          {selectedInvoice && selectedInvoice.status !== 'Paid' && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                <span className="truncate">
                  {t("Direct Payment Link")}: <strong className="font-mono text-indigo-700">{typeof window !== 'undefined' ? window.location.origin : ''}/pay-invoice/{selectedInvoice.id}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyPaymentLink(selectedInvoice)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 cursor-pointer"
              >
                {t("Copy")}
              </button>
            </div>
          )}

          {/* Authentic Commercial Merchant Invoice Dossier */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
            {/* Farm Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-indigo-600 pb-5">
              <div className="flex items-center gap-3">
                {whiteLabel?.logoUrl ? (
                  <img src={whiteLabel.logoUrl} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-md shrink-0" />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-2xl text-white font-black flex items-center justify-center text-xl shadow-md shrink-0"
                    style={{ backgroundColor: whiteLabel?.primaryColor || '#4f46e5' }}
                  >
                    {whiteLabel?.brandLogoText || <Building2 size={24} />}
                  </div>
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {farmName}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">{farmType} • {t("Commercial Farm Operations")}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t("Support")}: {farmEmail} | {t("Tel")}: {farmPhone}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-mono block">{t("INVOICE")}</span>
                <p className="text-xs font-bold text-indigo-600 font-mono">#{selectedInvoice?.id}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("Date")}: <strong className="text-slate-800 font-mono">{selectedInvoice?.date}</strong></p>
              </div>
            </div>

            {/* Billing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t("Billed Customer")}</span>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900">{selectedInvoice?.customerName}</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">{t("Commercial Wholesale Client")}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t("Total Valuation Due")}</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-700">
                  {currencySymbol}{selectedInvoice?.totalAmount.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{t("Payment Terms: Immediate Settlement")}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[420px]">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{t("Item Description")}</th>
                    <th className="py-3 px-4 text-center">{t("Qty")}</th>
                    <th className="py-3 px-4 text-right">{t("Unit Price")}</th>
                    <th className="py-3 px-4 text-right">{t("Line Total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  <tr>
                    <td className="py-4 px-4 font-semibold text-slate-900 font-sans">{selectedInvoice?.items}</td>
                    <td className="py-4 px-4 text-center text-slate-600">{selectedInvoice?.quantity}</td>
                    <td className="py-4 px-4 text-right text-slate-600">{currencySymbol}{selectedInvoice?.unitPrice.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900">{currencySymbol}{selectedInvoice?.totalAmount.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50/70 font-sans text-[11px]">
                    <td colSpan={3} className="py-2.5 px-4 text-right text-slate-500 font-semibold">{t("Subtotal")}:</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{currencySymbol}{selectedInvoice?.totalAmount.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50/70 font-sans text-[11px]">
                    <td colSpan={3} className="py-2 px-4 text-right text-slate-500 font-semibold">{t("VAT / Farm Produce Tax (0%)")}:</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-500">{currencySymbol}0.00</td>
                  </tr>
                  <tr className="bg-indigo-50/60 font-sans text-xs">
                    <td colSpan={3} className="py-3 px-4 text-right text-indigo-950 font-black uppercase tracking-wider">{t("Grand Total Due")}:</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-sm">{currencySymbol}{selectedInvoice?.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Settlement & Status Modifier Drawer */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-slate-600 uppercase">{t("Change Status")}:</span>
                <select
                  value={selectedInvoice?.status || 'Unpaid'}
                  onChange={(e) => selectedInvoice && handleUpdateInvoiceStatus(selectedInvoice.id, e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="Unpaid">{t("Unpaid")}</option>
                  <option value="Pending">{t("Pending")}</option>
                  <option value="Paid">{t("Paid")}</option>
                </select>

                {selectedInvoice?.status !== 'Paid' && (
                  <Button
                    variant="success"
                    size="sm"
                    leftIcon={<CheckCircle2 size={13} />}
                    onClick={() => selectedInvoice && handleUpdateInvoiceStatus(selectedInvoice.id, 'Paid')}
                  >
                    {t("Mark as Paid (Offline)")}
                  </Button>
                )}
              </div>

              <div className="text-[11px] text-slate-400 font-medium sm:text-right">
                {t("Verified Commercial Transaction")} • {farmName}
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">{t("Invoice")} #{selectedInvoice?.id}</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleCloseInvoiceView}>
                {t("Close Preview")}
              </Button>
              <Button variant="primary" leftIcon={<Printer size={15} />} onClick={handlePrint}>
                {t("Print Receipt PDF")}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
