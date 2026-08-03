import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { PayInvoiceClient } from "@/components/features/sales/PayInvoiceClient";

export default async function PayInvoicePage({ params }: { params: { id: string } }) {
  const invoiceId = params.id;

  // 1. Fetch the invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    return notFound();
  }

  // 2. Fetch the farm's system settings to get Paystack Public Key
  const { data: systemSettings } = await supabase
    .from("systemSettings")
    .select("paystackPublicKey, adminEmail, adminName")
    .eq("workspaceId", invoice.workspaceId)
    .single();

  const paystackPublicKey = systemSettings?.paystackPublicKey;
  const farmName = systemSettings?.adminName || "Poultry Farm";
  const farmEmail = systemSettings?.adminEmail || "farm@example.com";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
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
