'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PhoneCall, Plus, Building2, Palette, ArrowRightLeft, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/features/LanguageContext';

interface VetHotlineClientProps {
  tier: string;
  consultants?: any[];
}

export function VetHotlineClient({ tier, consultants: initialConsultants = [] }: VetHotlineClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const normTier = (tier || '').toLowerCase();
  const isEnterprise = normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus';

  const [consultants, setConsultants] = useState<any[]>(initialConsultants);
  const [openVetModal, setOpenVetModal] = useState(false);
  const [ticketType, setTicketType] = useState('Emergency Outbreak Alert');
  const [ticketNotes, setTicketNotes] = useState('');
  const [ticketPhone] = useState('+234 800-POULTRY-VET');

  const handleCreateVetTicket = async () => {
    try {
      const res = await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_vet_ticket',
          ticketType,
          notes: ticketNotes,
          contactPhone: ticketPhone
        })
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setConsultants(prev => [data.ticket, ...prev]);
        setOpenVetModal(false);
        setTicketNotes('');
        toast.success(t('Emergency Vet Ticket Dispatched to Lead Veterinarian!'));
      }
    } catch (_e) {
      toast.error(t('Failed to dispatch ticket'));
    }
  };

  if (!isEnterprise) {
    return (
      <div className="space-y-6 max-w-4xl pb-16 font-sans">
        <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl text-center space-y-5 shadow-sm">
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[10px] px-3 py-1 rounded-full">
              {t("ENTERPRISE TIER REQUIRED")}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 pt-1">{t("24/7 Priority Veterinarian Hotline")}</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t("Direct access to certified poultry disease specialists, emergency outbreak tickets, and routine farm audits are exclusively available on Enterprise Plus.")}
            </p>
          </div>

          <div className="pt-2 max-w-md mx-auto">
            <button
              onClick={() => router.push('/dashboard/settings?tab=subscription')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl shadow transition-all cursor-pointer"
            >
              {t("Upgrade to Enterprise & Cooperative (₦45,000/mo)")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16 font-sans">
      {/* Top Enterprise Sub-Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1 text-xs font-bold tracking-wider">
        <button
          onClick={() => router.push('/dashboard/enterprise/branches')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Building2 size={16} /> {t("Branch Matrix")}
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/whitelabel')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Palette size={16} /> {t("White-Label & Themes")}
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/api')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <ArrowRightLeft size={16} /> {t("API Keys & Webhooks")}
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/vet')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap bg-emerald-600 text-white shadow-md"
        >
          <PhoneCall size={16} /> {t("24/7 Vet Hotline")} ({consultants.length})
        </button>

        <button
          onClick={() => router.push('/dashboard/enterprise/feed-pool')}
          className="px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Layers size={16} /> {t("Wholesale Feed Pool")}
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PhoneCall size={24} className="text-emerald-600 shrink-0" />
            {t("24/7 Priority Vet & Inspection Hotline")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t("Direct priority hotline to certified poultry disease specialists and emergency outbreak inspection tickets.")}
          </p>
        </div>

        <button
          onClick={() => setOpenVetModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={15} /> {t("Dispatch Emergency Vet Ticket")}
        </button>
      </div>

      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall size={18} className="text-emerald-600 shrink-0" /> {t("Dedicated Poultry Doctor & Audit Logs")}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="bg-emerald-50/60 border border-emerald-200 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded font-mono">
                {t("24/7 Dedicated Vet Consultant")}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{t("On-Call Certified Veterinary Specialist")}</h3>
              <p className="text-xs text-slate-600 font-mono">+234 800-POULTRY-VET ({t("Emergency Outbreak Alert")})</p>
            </div>

            <a 
              href="https://wa.me/2348000000000?text=Hello%20Doctor,%20I%20need%20urgent%20consultation%20for%20my%20poultry%20farm" 
              target="_blank" 
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall size={15} /> {t("Call Vet Specialist")}
            </a>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 tracking-wider">{t("Dispatched Vet Tickets")} ({consultants.length})</h4>
            {consultants.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                {t("No active veterinarian inspection tickets. Click \"Dispatch Emergency Vet Ticket\" to request an inspection.")}
              </div>
            ) : (
              consultants.map((tc) => (
                <div key={tc.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t(tc.ticketType) || tc.ticketType}</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded font-mono">
                        {t(tc.status || 'Active')}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{tc.notes}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{tc.createdAt?.slice(0, 10)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Vet Ticket Modal */}
      {openVetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall size={18} className="text-emerald-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">{t("Dispatch Emergency Vet Ticket")}</h3>
              </div>
              <button onClick={() => setOpenVetModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 text-sm">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t("Issue Category *")}</label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  <option value="Emergency Outbreak Alert">{t("Emergency Outbreak Alert")}</option>
                  <option value="Feed Quality Audit Request">{t("Feed Quality Audit Request")}</option>
                  <option value="Monthly Flock Inspection Audit">{t("Monthly Flock Inspection Audit")}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t("Symptoms / Notes *")}</label>
                <textarea
                  rows={3}
                  placeholder={t("Symptoms / Notes *")}
                  value={ticketNotes}
                  onChange={(e) => setTicketNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>

              <button
                onClick={handleCreateVetTicket}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow cursor-pointer transition-colors"
              >
                {t("Dispatch Vet Ticket")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
