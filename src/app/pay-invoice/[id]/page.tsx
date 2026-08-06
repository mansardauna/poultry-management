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

  // 2. Fetch the farm's system settings to get Paystack Public Key
  let paystackPublicKey: string | null = null;
  let farmName = "Poultry Farm Management System";
  let farmEmail = "billing@poultryfarm.com";

  if (invoice.workspaceId) {
    const { data: systemSettings } = await supabase
      .from("systemSettings")
      .select("paystackPublicKey, adminEmail, adminName")
      .eq("workspaceId", invoice.workspaceId)
      .limit(1)
      .maybeSingle();

    if (systemSettings) {
      if (systemSettings.paystackPublicKey) paystackPublicKey = systemSettings.paystackPublicKey;
      if (systemSettings.adminName) farmName = systemSettings.adminName;
      if (systemSettings.adminEmail) farmEmail = systemSettings.adminEmail;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-xl w-full">
        <PayInvoiceClient 
          invoice={invoice} 
          paystackPublicKey={paystackPublicKey}
          farmName={farmName}
          farmEmail={farmEmail}
        />
      </div>
    </div>
  );
}
