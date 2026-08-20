'use strict';
'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Sparkles, Clock, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CCTVPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8 font-sans">
      <Card className="border border-slate-200 bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-xs uppercase px-4 py-1.5 rounded-full">
          <Clock size={14} className="text-amber-700" />
          <span>COMING SOON</span>
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Surveillance CCTV & Live Streaming
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed font-medium">
            We are currently developing seamless 24/7 hardware IP camera streaming, V380 Pro NVR integration, and automated AI predator motion alerts for farm owners.
          </p>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs text-slate-700 font-semibold">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <ShieldCheck size={16} /> 24/7 Live Stream
            </div>
            <p className="text-[11px] text-slate-500 font-normal">HD RTSP & WebRTC multi-camera grid playback from anywhere.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <Sparkles size={16} /> AI Motion Detect
            </div>
            <p className="text-[11px] text-slate-500 font-normal">Instant predator detection & automated phone push notifications.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-purple-600 font-bold">
              <Clock size={16} /> QR Camera Scan
            </div>
            <p className="text-[11px] text-slate-500 font-normal">1-step QR code sticker pairing for V380 Pro and Hikvision cameras.</p>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-8 py-3 rounded-xl shadow transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </Card>
    </div>
  );
}
