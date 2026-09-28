'use strict';
'use client';

import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function ImpersonationBanner({
  orgName,
  adminEmail
}: {
  orgName?: string;
  adminEmail?: string;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    setIsExiting(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'exit_impersonate' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Exited tenant session. Returning to Super Admin portal...');
        window.location.href = data.redirectUrl || '/dashboard/admin?tab=orgs';
      } else {
        toast.error(data.error || 'Failed to exit impersonation');
        setIsExiting(false);
      }
    } catch (_err) {
      toast.error('Network error exiting impersonation');
      setIsExiting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 shrink-0 z-50 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2 overflow-hidden">
        <ShieldAlert size={16} className="text-amber-200 shrink-0 animate-pulse" />
        <span className="truncate">
          <strong className="underline decoration-amber-300">Impersonation Mode:</strong> You are actively managing farm <span className="font-bold text-amber-100">{orgName || 'Tenant Farm'}</span> ({adminEmail || 'Farm Admin'}).
        </span>
      </div>

      <button
        onClick={handleExit}
        disabled={isExiting}
        className="bg-white/95 hover:bg-white text-slate-900 px-3 py-1 rounded-md text-[11px] font-bold shadow-sm flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 cursor-pointer"
      >
        {isExiting ? <Loader2 size={13} className="animate-spin text-amber-600" /> : <ArrowLeft size={13} className="text-amber-600" />}
        <span>Exit & Return to Super Admin</span>
      </button>
    </div>
  );
}
