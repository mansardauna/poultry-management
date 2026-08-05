'use strict';
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Play, Video, AlertTriangle, Activity, RefreshCw, Phone, Circle, QrCode } from 'lucide-react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button as MuiButton 
} from '@mui/material';

import { useRouter } from 'next/navigation';

interface DiagnosticsLog {
  id: string;
  date: string;
  device: string;
  event: string;
  status: string;
}

export default function CCTVPage() {
  const router = useRouter();
  const [openRepairModal, setOpenRepairModal] = useState(false);
  const [openConnectModal, setOpenConnectModal] = useState(false);
  const [cameraId, setCameraId] = useState('');
  const [technicianNote, setTechnicianNote] = useState('');
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<DiagnosticsLog[]>([]);
  const [isCameraBRebooting, setIsCameraBRebooting] = useState(false);
  const [tier, setTier] = useState('free');

  useEffect(() => {
    const match = document.cookie.match(/pfms_tier=([^;]+)/);
    if (match) setTier(match[1]);
  }, []);

  const refreshLogs = async () => {
    try {
      const res = await fetch('/api/cctv');
      if (res.ok) {
        const logs = await res.json();
        setDiagnosticsLogs(logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshLogs();
  }, []);

  const handleOpenRepair = () => setOpenRepairModal(true);
  const handleCloseRepair = () => {
    setOpenRepairModal(false);
    setTechnicianNote('');
  };

  const handleOpenConnect = () => setOpenConnectModal(true);
  const handleCloseConnect = () => {
    setOpenConnectModal(false);
    setCameraId('');
  };

  const handleConnectCamera = () => {
    if (!cameraId) return;
    toast.success(`Successfully paired with camera ${cameraId}!`);
    handleCloseConnect();
  };

  const handleDispatchTechnician = async () => {
    if (!technicianNote) return;

    try {
      const res = await fetch('/api/cctv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch',
          notes: technicianNote,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        refreshLogs();
        handleCloseRepair();
        toast.success('Technician dispatched! Ticket created in system.');
      } else {
        toast.error('Failed to submit technician request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePingGateway = async () => {
    try {
      const res = await fetch('/api/cctv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ping'
        })
      });
      if (res.ok) {
        refreshLogs();
        toast.success('Ping sent! Gateway response: 2ms (Healthy).');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSoftReboot = async (device: string) => {
    try {
      const res = await fetch('/api/cctv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reboot',
          device
        })
      });
      if (res.ok) {
        refreshLogs();
        if (device === 'Camera Array B') {
          setIsCameraBRebooting(true);
          setTimeout(() => setIsCameraBRebooting(false), 8000);
        }
        toast.success(`Reboot signal sent to ${device}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (tier === 'free') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black uppercase px-4 py-1.5 rounded-bl-xl shadow">
            COMMERCIAL PRO FEATURE
          </div>
          
          <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-400/30 animate-pulse">
            <Video size={42} />
          </div>

          <h2 className="text-3xl font-extrabold text-white mb-3">Live CCTV Monitoring & AI Motion Alerts</h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Continuous HD security surveillance, automated predator & intruder motion detection, multi-camera grid streaming, and remote technician dispatch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto mb-8 text-xs font-semibold text-slate-200">
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span> Multi-Coop Live Streams
            </div>
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span> AI Predator Alerts
            </div>
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span> Remote Dispatch Controls
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/settings')}
            className="bg-gradient-to-r from-amber-400 via-indigo-500 to-amber-400 text-slate-950 font-black text-base px-8 py-4 rounded-xl shadow-2xl hover:scale-105 transition-transform"
          >
            ⚡ Unlock CCTV Monitoring for ₦15,000/mo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CCTV Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 uppercase">Surveillance CCTV Connectivity</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time security monitoring & system health</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenConnect}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-sm font-semibold uppercase transition-colors flex items-center gap-2"
          >
            <QrCode size={18} /> Connect Camera
          </button>
          <button 
            onClick={handleOpenRepair}
            className="bg-red-650 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold uppercase transition-colors flex items-center gap-2"
          >
            <Phone size={18} /> Dispatch Technician
          </button>
        </div>
      </div>

      {/* Critical System Alert Banner */}
      <div className="border-2 border-red-500 bg-red-50 p-4 flex items-center gap-4">
        <AlertTriangle size={36} className="text-red-600 animate-pulse flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-950 uppercase">🚨 SECURITY SURVEILLANCE CRITICAL MALFUNCTION</p>
          <p className="text-xs text-red-800 mt-0.5">
            <strong>System Drop Detected:</strong> Camera Array B (Coop 2 Laying Section) has suffered a critical drop and is currently OFFLINE. Perimeter stability is compromised! Restore continuous uptime on security arrays immediately.
          </p>
        </div>
      </div>

      {/* Camera Live Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera A - Unstable */}
        <Card className="rounded-md border-2 border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Circle size={14} className="text-emerald-500 animate-ping" /> Camera Array A (Perimeter / Section A)
            </CardTitle>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 uppercase">
              Signal Unstable (Jitter)
            </span>
          </CardHeader>
          <CardContent className="p-0 relative bg-slate-950 aspect-video flex items-center justify-center text-white overflow-hidden">
            {/* Simulated Live Camera with scanlines / static noise overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_100%)]" />
            
            {/* Visual Stream Mock */}
            <div className="w-full h-full flex flex-col justify-between p-4 font-mono text-[10px] text-emerald-400 z-10">
              <div className="flex justify-between">
                <span>CAM_A_PERIMETER</span>
                <span>REC ●</span>
              </div>
              <div className="text-center text-slate-500 text-xs py-4 flex flex-col items-center gap-2">
                <Play size={32} className="text-indigo-400 animate-pulse" />
                <span className="font-semibold text-slate-300">STREAMING FROM COOP SECTION A</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>1080P @ 15FPS</span>
                <span>MAY-16-2026 12:44:19 PM</span>
              </div>
            </div>

            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
          </CardContent>
        </Card>

        {/* Camera B - MALFUNCTION STATE */}
        <Card className={`rounded-md border-2 ${isCameraBRebooting ? 'border-amber-400 bg-amber-50/10' : 'border-red-500 bg-red-50/10'}`}>
            <CardHeader className={`${isCameraBRebooting ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'} border-b py-3 flex items-center justify-between`}>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <Video size={16} className={`${isCameraBRebooting ? 'text-amber-600 animate-spin' : 'text-red-650 animate-pulse'}`} /> Camera Array B (Coop 2 / Section B)
            </CardTitle>
            <span className={`text-[10px] font-semibold px-2 py-0.5 uppercase ${
              isCameraBRebooting ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-red-100 text-red-800 animate-pulse'
            }`}>
              {isCameraBRebooting ? 'SYSTEM REBOOT IN PROGRESS...' : 'OFFLINE / CRITICAL MALFUNCTION'}
            </span>
          </CardHeader>
          <CardContent className="p-0 relative bg-slate-900 aspect-video flex items-center justify-center text-white overflow-hidden">
            {/* TV Static Noise overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#fff_0%,#000_100%)] animate-pulse" />
            
            {/* Visual Stream Mock */}
            <div className={`w-full h-full flex flex-col justify-between p-4 font-mono text-[10px] z-10 ${
              isCameraBRebooting ? 'text-amber-500' : 'text-red-500'
            }`}>
              <div className="flex justify-between">
                <span>CAM_B_COOP2_LAYING</span>
                <span>{isCameraBRebooting ? 'REBOOTING ↻' : 'OFFLINE ✖'}</span>
              </div>
              <div className="text-center py-4 flex flex-col items-center gap-2">
                <Video size="40" className={isCameraBRebooting ? 'text-amber-500 animate-spin' : 'text-red-500 animate-bounce'} />
                <span className="font-semibold text-sm tracking-wider uppercase">
                  {isCameraBRebooting ? 'HANDSHAKE NEGOTIATING' : 'NO CARRIER SIGNAL'}
                </span>
                <span className="text-[10px]">
                  {isCameraBRebooting ? 'BROADCASTING HARDWARE BOOTLOADER...' : 'HARDWARE INTERRUPT (CHECK POWER/CABLES)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>0.00KB/S @ 0FPS</span>
                <span>{isCameraBRebooting ? 'RE-ESTABLISHING PROTOCOLS' : 'SYSTEM CONNECTION LOST'}</span>
              </div>
            </div>

            {/* Static Scanline lines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_8px]" />
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics Logs & Diagnostic Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
              Surveillance Network Diagnostic Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp / Date</th>
                    <th className="px-4 py-3">Component / Device</th>
                    <th className="px-4 py-3">Incident / Event</th>
                    <th className="px-4 py-3">Diagnostic Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {diagnosticsLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400">{log.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.device}</td>
                      <td className="px-4 py-3 text-slate-650 font-medium">{log.event}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase ${
                          log.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800' :
                          log.status === 'Warning' ? 'bg-amber-100 text-amber-800' :
                          log.status === 'Error' ? 'bg-red-100 text-red-800 animate-pulse' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Control Actions Panel */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-semibold uppercase text-slate-700 tracking-wider">
              Diagnostic Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-xs text-slate-500">Perform real-time signals, router pings, or device resets to resolve CCTV network drops:</p>
            
            <button 
              onClick={handlePingGateway}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-2.5 text-xs font-semibold uppercase transition-all flex items-center justify-center gap-2"
            >
              <Activity size="16" /> Ping NVR Router Gateway
            </button>

            <button 
              onClick={() => handleSoftReboot('Camera Array A')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-2.5 text-xs font-semibold uppercase transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size="16" /> Soft-Reboot Camera Array A
            </button>

            <button 
              onClick={() => handleSoftReboot('Camera Array B')}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 text-xs font-semibold uppercase transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size="16" /> Recover / Reboot Camera Array B
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Dispatch Technician Modal */}
      <Dialog open={openRepairModal} onClose={handleCloseRepair} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 600 }}>Dispatch Security System Technician</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <div className="h-2" />
          <p className="text-xs text-slate-500">
            This will dispatch a field technician to inspect and fix the security camera wiring, network drops, or hardware malfunctions.
          </p>
          <TextField
            label="Service Ticket Notes & Details"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="e.g. Camera Array B (Section B) is completely offline. Hardware interrupt. Please inspect wiring and power lines immediately."
            value={technicianNote}
            onChange={(e) => setTechnicianNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseRepair} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleDispatchTechnician} 
            variant="contained" 
            disabled={!technicianNote}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Dispatch Now
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Connect Camera Modal */}
      <Dialog open={openConnectModal} onClose={handleCloseConnect} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
        <DialogTitle sx={{ fontFamily: 'var(--font-cal-sans)', textTransform: 'uppercase', fontWeight: 600 }}>Pair New Camera via QR Code</DialogTitle>
        <DialogContent className="flex flex-col gap-6 pt-4 items-center text-center">
          <div className="h-2" />
          <p className="text-xs text-slate-500">
            Scan this QR code using the Farm Camera App, or manually enter the Camera ID below to pair it to the central NVR system.
          </p>
          <div className="bg-slate-50 p-6 rounded-lg border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center gap-3 w-48 h-48">
            <QrCode size={96} className="text-indigo-600" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">NVR-SYNC-AWAIT</span>
          </div>
          <TextField
            label="Hardware Camera ID (e.g. CAM-2938-X)"
            fullWidth
            variant="outlined"
            placeholder="Enter ID manually..."
            value={cameraId}
            onChange={(e) => setCameraId(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MuiButton onClick={handleCloseConnect} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleConnectCamera} 
            variant="contained" 
            disabled={!cameraId}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, boxShadow: 'none' }}
          >
            Pair Camera
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
