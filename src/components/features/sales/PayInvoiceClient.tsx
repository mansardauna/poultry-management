'use client';

import { useState } from 'react';
import { Invoice } from '@/data/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@mui/material';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
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
    reference: (new Date()).getTime().toString(),
    email: farmEmail, // Paystack requires an email. We use farm's email if customer email isn't in invoice.
    amount: invoice.totalAmount * 100, // Paystack expects amount in Kobo
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
        toast.success('Payment successful!');
      } else {
        toast.error('Payment verified locally, but failed to update server.');
      }
    } catch (err) {
      toast.error('Server error during payment verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onClose = () => {
    toast.error('Payment cancelled.');
  };

  const handlePay = () => {
    if (!paystackPublicKey) {
      toast.error('This farm has not configured online payments yet.');
      return;
    }
    initializePayment({ onSuccess, onClose });
  };

  if (status === 'Paid') {
    return (
      <Card className="shadow-lg border-emerald-100">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Invoice Paid</h2>
          <p className="text-slate-500">Thank you! This invoice has been successfully paid.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-indigo-600 text-white rounded-t-xl text-center py-6">
        <CardTitle className="text-xl font-bold tracking-wide flex justify-center items-center gap-2">
          <FileText /> {farmName} Invoice
        </CardTitle>
        <p className="text-indigo-200 text-sm mt-1">Invoice #{invoice.id}</p>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-4 font-mono text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Customer</span>
            <span className="font-semibold text-slate-800">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Date</span>
            <span className="font-semibold text-slate-800">{invoice.date}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Items</span>
            <span className="font-semibold text-slate-800 text-right">{invoice.items} ({invoice.quantity} units)</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider">Total Amount Due</span>
            <span className="font-bold text-xl text-indigo-600">₦{invoice.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {!paystackPublicKey ? (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex gap-3 text-sm font-medium">
            <AlertCircle className="shrink-0" />
            <p>Online payments are currently disabled for this farm. Please contact {farmName} for alternative payment methods.</p>
          </div>
        ) : (
          <Button 
            onClick={handlePay}
            disabled={isProcessing}
            variant="contained" 
            fullWidth
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, py: 1.5, fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
          >
            {isProcessing ? 'Verifying...' : `Pay ₦${invoice.totalAmount.toLocaleString()} Now`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
