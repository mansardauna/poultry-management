'use strict';
'use client';

import React from 'react';
import { Card } from "@/components/ui/Card";
import { Sparkles, ArrowLeft, CheckCircle2, Clock, Radio, Video, Calendar, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/features/LanguageContext';

export default function CCTVPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8 font-sans">
      <Card className="border border-slate-200 bg-white rounded-3xl p-6 sm:p-12 text-center shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-xs uppercase px-4 py-1.5 rounded-full">
          <Calendar size={14} className="text-indigo-600" />
          <span>{t("Product Roadmap • Scheduled Release")}</span>
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Video size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("CCTV Live Surveillance — On the Roadmap")}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed font-medium">
            {t("Hardware IP camera streaming, local NVR gateway pairing, and real-time AI predator detection are currently under active development on our engineering roadmap.")}
          </p>
        </div>

        {/* Roadmap Milestones */}
        <div className="pt-2 max-w-2xl mx-auto text-left space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t("Development Milestones")}
          </h2>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-emerald-900">{t("Phase 1: Architecture & Video Pipeline Specs")}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">{t("Completed")}</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {t("WebRTC multi-stream mesh design and low-latency farm bandwidth profiling.")}
              </p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <Radio size={18} className="text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-indigo-900">{t("Phase 2: RTSP/ONVIF Gateway & Local NVR Testing")}</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">{t("In Progress")}</span>
              </div>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                {t("Integration with V380 Pro, Hikvision, and standard RTSP farm cameras for secure LAN tunneling.")}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <Clock size={18} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">{t("Phase 3: Real-Time Grid View & Mobile Streaming")}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">{t("Scheduled")}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t("Multi-camera split-screen display and secure mobile companion viewing.")}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <Sparkles size={18} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">{t("Phase 4: AI Predator & Intrusion Detection")}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">{t("Scheduled")}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t("Automated night-vision motion detection with instant WhatsApp and SMS predator alerts.")}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-6 py-3 rounded-xl shadow transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> {t("Back to Dashboard")}
          </button>
        </div>
      </Card>
    </div>
  );
}
