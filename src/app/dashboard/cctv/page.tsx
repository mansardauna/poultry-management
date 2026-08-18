'use strict';
'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Video, ShieldCheck, Sparkles, Clock, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CCTVPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-12 font-sans">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black text-xs uppercase px-4 py-1.5 rounded-full shadow-sm">
          <Clock size={16} className="animate-spin text-amber-400" />
          <span>COMING SOON</span>
        </div>

        <div className="w-24 h-24 bg-indigo-600/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto border-2 border-indigo-500/40 shadow-inner animate-pulse">
          <Video size={48} />
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Surveillance CCTV & Live Streaming
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            We are currently developing seamless 24/7 hardware IP camera streaming, V380 Pro NVR integration, and automated AI predator motion alerts for farm owners.
          </p>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs text-slate-300 font-semibold">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <ShieldCheck size={16} /> 24/7 Live Stream
            </div>
            <p className="text-[11px] text-slate-400 font-normal">HD RTSP & WebRTC multi-camera grid playback from anywhere.</p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Sparkles size={16} /> AI Motion Detect
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Instant predator detection & automated phone push notifications.</p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Clock size={16} /> QR Camera Scan
            </div>
            <p className="text-[11px] text-slate-400 font-normal">1-step QR code sticker pairing for V380 Pro and Hikvision cameras.</p>
          </div>
        </div>

        <div className="pt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-8 py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
