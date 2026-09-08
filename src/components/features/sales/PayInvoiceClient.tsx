'use client';

import { useState, useEffect } from 'react';
import { Invoice } from '@/data/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@mui/material';
import { CheckCircle2, Lock, CreditCard, Building2, Copy, ArrowRight, Banknote, ShieldAlert, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PayInvoiceClientProps {
  invoice: Invoice;
  paystackPublicKey?: string | null;
  stripePublicKey?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  farmName: string;
  farmEmail: string;
  isPaidPlan?: boolean;
}

export function PayInvoiceClient({ 
  invoice, 
  paystackPublicKey, 
  stripePublicKey,
  bankName,
  accountNumber,
  accountName,
  farmName, 
  farmEmail,
  isPaidPlan = true
}: PayInvoiceClientProps) {
  const [status, setStatus] = useState(invoice.status);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasBankDetails = Boolean(bankName && accountNumber);
  const hasGatewayKey = Boolean(paystackPublicKey || stripePublicKey);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');

  // Load Paystack Inline JS script dynamically if key exists
  useEffect(() => {
    if (paystackPublicKey && typeof window !== 'undefined') {
      const scriptId = 'paystack-inline-js';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [paystackPublicKey]);

  const handleCardCheckout = async () => {
    if (!isPaidPlan) {
      toast.error('Online Payment links are exclusive to Commercial Pro & Enterprise plans.');
      return;
    }

    if (!hasGatewayKey) {
      toast.error('Payment gateway API key has not been configured by farm admin in Settings.');
      return;
    }

    setIsProcessing(true);
    toast.loading('Connecting to Official Payment Gateway...', { id: 'pay-toast' });

    try {
      if (paystackPublicKey && typeof window !== 'undefined' && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: paystackPublicKey,
          email: farmEmail || 'customer@example.com',
          amount: invoice.totalAmount * 100, // Kobo
          currency: 'NGN',
          ref: `PAY-${Date.now()}-${invoice.id.slice(-4)}`,
          callback: async (response: any) => {
            await verifyInvoicePayment(response.reference || response.trxref);
          },
          onClose: () => {
            toast.dismiss('pay-toast');
            toast.error('Payment session closed');
            setIsProcessing(false);
          }
        });
        handler.openIframe();
      } else {
        toast.dismiss('pay-toast');
        toast.error('Payment gateway popup script failed to load. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      toast.dismiss('pay-toast');
      toast.error('Failed to launch payment popup');
      setIsProcessing(false);
    }
  };

  const verifyInvoicePayment = async (reference: string) => {
    try {
      toast.loading('Verifying transaction with gateway...', { id: 'pay-toast' });
      const res = await fetch('/api/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          reference: reference
        })
      });

      toast.dismiss('pay-toast');
      if (res.ok) {
        setStatus('Paid');
        toast.success('Payment verified successfully! Invoice updated to Paid.');
      } else {
        const data = await res.json();
        toast.error(data?.error || 'Payment verification failed with gateway.');
      }
    } catch (_err) {
      toast.dismiss('pay-toast');
      toast.error('Server error verifying transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyInvoiceLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Invoice link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl bg-white">
        {/* Executive Merchant Header */}
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
                  <p className="text-xs text-indigo-200">Official Merchant Customer Invoice</p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                status === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                ● {status === 'Paid' ? 'PAYMENT RECEIVED' : 'PAYMENT AWAITING'}
              </span>
              <p className="text-xs text-slate-400 font-mono mt-2">Invoice #{invoice.id}</p>
            </div>
          </div>
        </div>

        {/* Invoice Body */}
        <CardContent className="p-8 sm:p-10 space-y-8 bg-white">
          <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
              <p className="font-extrabold text-slate-900 text-sm">{invoice.customerName}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Issue Date</span>
              <p className="font-semibold text-slate-800 text-sm font-mono">{invoice.date}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
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
                  <td className="py-4 px-4 font-semibold text-slate-900 font-sans">{invoice.items}</td>
                  <td className="py-4 px-4 text-center text-slate-600">{invoice.quantity}</td>
                  <td className="py-4 px-4 text-right text-slate-600">₦{invoice.unitPrice.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right font-extrabold text-slate-900">₦{invoice.totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-indigo-50/60 p-6 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">Total Amount Due</span>
              <span className="text-xs text-slate-500">Includes all applicable charges & fees</span>
            </div>
            <div className="text-3xl font-black font-mono text-indigo-650">
              ₦{invoice.totalAmount.toLocaleString()}
            </div>
          </div>

          {/* Payment Section */}
          {status === 'Paid' ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-8 rounded-2xl text-center space-y-3 shadow-sm">
              <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
              <h3 className="text-xl font-extrabold text-emerald-900">Invoice Paid & Verified</h3>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Payment of <strong>₦{invoice.totalAmount.toLocaleString()}</strong> has been settled successfully.
              </p>
              <div className="pt-2">
                <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2">
                  Print Official Receipt PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Plan Restriction Notice */}
              {!isPaidPlan ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
                  <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950 mb-0.5">Online Payment Gateway Link Unavailable</h4>
                    <p className="text-slate-600 leading-relaxed">
                      This farm is currently on the Free Plan. Automated online card payment links require a <strong>Commercial Pro</strong> or <strong>Enterprise Plan</strong> upgrade.
                    </p>
                  </div>
                </div>
              ) : !hasGatewayKey ? (
                /* Missing Key Notice */
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 text-xs flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-0.5">Online Payment Key Not Configured</h4>
                    <p className="text-slate-600 leading-relaxed">
                      The farm admin has not configured their payment gateway API keys in Settings. Please pay via Direct Bank Transfer below or contact the farm.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Select Payment Mode (only show if bank details exist) */}
              {hasBankDetails && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Choose Payment Method:
                  </label>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <CreditCard size={18} className="text-indigo-600" />
                      Card & Online Payment
                    </button>

                    <button
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'transfer'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Banknote size={18} className="text-indigo-600" />
                      Bank Transfer
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Details / Action Button */}
              {paymentMethod === 'transfer' && hasBankDetails ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Direct Merchant Bank Account</h4>
                  <div className="space-y-2 font-mono bg-white p-4 rounded-xl border border-slate-200 text-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank Name:</span>
                      <strong className="text-slate-900">{bankName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Number:</span>
                      <strong className="text-indigo-600 text-sm">{accountNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Name:</span>
                      <strong className="text-slate-900">{accountName || farmName}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Please transfer <strong>₦{invoice.totalAmount.toLocaleString()}</strong> to the account above and send proof of payment to the farm manager.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleCardCheckout}
                  disabled={isProcessing || !isPaidPlan || !hasGatewayKey}
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: (!isPaidPlan || !hasGatewayKey) ? '#94a3b8' : '#4f46e5',
                    '&:hover': { bgcolor: (!isPaidPlan || !hasGatewayKey) ? '#94a3b8' : '#4338ca' },
                    py: 2,
                    fontSize: '16px',
                    fontWeight: 800,
                    borderRadius: 3,
                    boxShadow: (!isPaidPlan || !hasGatewayKey) ? 'none' : '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
                  }}
                  startIcon={<CreditCard size={20} />}
                  endIcon={<ArrowRight size={20} />}
                >
                  {isProcessing ? 'Connecting to Gateway...' : `Pay ₦${invoice.totalAmount.toLocaleString()} Now`}
                </Button>
              )}

              {/* Security Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Lock size={12} className="text-emerald-500" /> 256-Bit SSL Encrypted & Verified Merchant Checkout
                </span>
                <button onClick={copyInvoiceLink} className="hover:text-slate-600 flex items-center gap-1 font-semibold transition-colors">
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
