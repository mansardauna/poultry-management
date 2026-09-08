'use strict';

import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { PayInvoiceClient } from "@/components/features/sales/PayInvoiceClient";

export default async function PayInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id || '';
  const invoiceId = decodeURIComponent(rawId).replace(/^#/, '').trim();

  if (!invoiceId) {
    return notFound();
  }

  // 1. Fetch the invoice from Supabase
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return notFound();
  }

  // 2. Fetch the farm's settings & plan tier
  let paystackPublicKey: string | null = null;
  let stripePublicKey: string | null = null;
  let bankName: string | null = null;
  let accountNumber: string | null = null;
  let accountName: string | null = null;
  let farmName = "Poultry Farm Enterprise";
  let farmEmail = "billing@poultryfarm.com";
  let isPaidPlan = true;

  if (invoice.workspaceId) {
    const { data: systemSettings } = await supabase
      .from("systemSettings")
      .select("*")
      .eq("workspaceId", invoice.workspaceId)
      .limit(1)
      .maybeSingle();

    if (systemSettings) {
      if (systemSettings.paystackPublicKey) paystackPublicKey = systemSettings.paystackPublicKey;
      if (systemSettings.stripePublicKey) stripePublicKey = systemSettings.stripePublicKey;
      if (systemSettings.bankName) bankName = systemSettings.bankName;
      if (systemSettings.accountNumber) accountNumber = systemSettings.accountNumber;
      if (systemSettings.accountName) accountName = systemSettings.accountName;
      if (systemSettings.adminName) farmName = systemSettings.adminName;
      if (systemSettings.adminEmail) farmEmail = systemSettings.adminEmail;

      if (systemSettings.subscriptionTier === 'free' || systemSettings.plan === 'free') {
        isPaidPlan = false;
      }
    }
  }

  // Fallback to platform public keys if farm admin has not specified custom keys
  if (!paystackPublicKey) {
    paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_3793f0a514d7924ef937e0e47089eeaa1a15f019';
  }
  if (!stripePublicKey) {
    stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OaL9pDjqS5IbRFu2ph5BzeDGGJ523QU4qr26XoSffgUqMySKyRsOvtsQzz47bPxmXzGytICrR9mlEIEvKL8KhML00bAJVhjNL';
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-xl w-full">
        <PayInvoiceClient 
          invoice={invoice} 
          paystackPublicKey={paystackPublicKey}
          stripePublicKey={stripePublicKey}
          bankName={bankName}
          accountNumber={accountNumber}
          accountName={accountName}
          farmName={farmName}
          farmEmail={farmEmail}
          isPaidPlan={isPaidPlan}
        />
      </div>
    </div>
  );
}
