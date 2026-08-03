'use client';

import { useState } from 'react';
import { Invoice } from '@/data/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@mui/material';
import { CheckCircle2, ShieldCheck, Lock, FileText, CreditCard, Building2, Copy } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import toast from 'react-hot-toast';

interface PayInvoiceClientProps {
  invoice: Invoice;
  paystackPublicKey?: string | null;
  farmName: string;
  farmEmail: string;
}

export function PayInvoiceClient({ invoice, paystackPublicKey, farmName, farmEmail }: PayInvoiceClientProps) {
  const [status, setStatus] = useState(invoice.status);
  const [isProcessing, setIsProcessing] = useState(false);

  const config = {
    reference: `PAY-${Date.now()}-${invoice.id.slice(-4)}`,
    email: farmEmail,
    amount: invoice.totalAmount * 100, // Kobo
    publicKey: paystackPublicKey || '',
    text: 'Pay Now',
    currency: 'NGN',
    metadata: {
      custom_fields: [
        {
          display_name: "Invoice ID",
          variable_name: "invoice_id",
          value: invoice.id,
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          reference: reference.reference
        })
      });

      if (res.ok) {
        setStatus('Paid');
        toast.success('Payment verified successfully!');
      } else {
        toast.error('Payment completed, but verification failed.');
      }
    } catch (_err) {
      toast.error('Server error during payment verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onClose = () => {
    toast.error('Payment session closed.');
  };

  const handlePay = () => {
    if (!paystackPublicKey) {
      toast.error('Online payments are not configured for this farm.');
      return;
    }
    initializePayment({ onSuccess, onClose });
  };

  const copyInvoiceLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Invoice link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-600/30">
                  <Building2 size={22} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white">{farmName}</h1>
                  <p className="text-xs text-indigo-200">Official Merchant Invoice</p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                status === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                ● {status === 'Paid' ? 'PAYMENT RECEIVED' : 'PAYMENT PENDING'}
              </span>
              <p className="text-xs text-slate-400 font-mono mt-2">ID: #{invoice.id}</p>
            </div>
          </div>
        </div>

        {/* Invoice Main Content */}
        <CardContent className="p-8 sm:p-10 space-y-8 bg-white">
          {/* Bill Details */}
          <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Name</span>
              <p className="font-semibold text-slate-800 text-sm">{invoice.customerName}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date Issued</span>
              <p className="font-semibold text-slate-800 text-sm font-mono">{invoice.date}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-4 px-4 font-semibold text-slate-900 font-sans">{invoice.items}</td>
                  <td className="py-4 px-4 text-center text-slate-600">{invoice.quantity}</td>
                  <td className="py-4 px-4 text-right text-slate-600">₦{invoice.unitPrice.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">₦{invoice.totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount Due Display */}
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">Total Amount Due</span>
              <span className="text-xs text-slate-500">Includes all applicable fees & taxes</span>
            </div>
            <div className="text-3xl font-black font-mono text-indigo-650">
              ₦{invoice.totalAmount.toLocaleString()}
            </div>
          </div>

          {/* Pay Button / Completed Banner */}
          {status === 'Paid' ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
              <h3 className="text-lg font-bold">This Invoice is Paid</h3>
              <p className="text-xs text-emerald-700">Thank you for your prompt payment! A copy of this receipt has been logged.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {!paystackPublicKey ? (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs flex items-center gap-3">
                  <ShieldCheck size={20} className="shrink-0 text-amber-600" />
                  <p>Online payments are currently being configured for this merchant. Please contact {farmName} directly.</p>
                </div>
              ) : (
                <Button
                  onClick={handlePay}
                  disabled={isProcessing}
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    py: 2,
                    fontSize: '16px',
                    fontWeight: 800,
                    borderRadius: 3,
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                  }}
                  startIcon={<CreditCard size={20} />}
                >
                  {isProcessing ? 'Verifying Transaction...' : `Pay ₦${invoice.totalAmount.toLocaleString()} via Paystack`}
                </Button>
              )}

              {/* Security & Trust Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Lock size={12} className="text-emerald-500" /> 256-Bit SSL Encrypted & Secured by Paystack
                </span>
                <button onClick={copyInvoiceLink} className="hover:text-slate-600 flex items-center gap-1 font-medium transition-colors">
                  <Copy size={12} /> Copy Link
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
