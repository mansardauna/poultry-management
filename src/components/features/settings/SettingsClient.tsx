'use strict';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertSettings } from "@/data/types";
import { 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Button as MuiButton 
} from '@mui/material';
import { Settings, BellRing, User, DollarSign, Trash2 } from 'lucide-react';

/**
 * Represents a workspace.
 */
interface Workspace {
  id: string;
  name: string;
  type: string;
}

/**
 * Represents the shape of system-level settings stored in the database.
 */
interface SystemSettings {
  id?: string;
  eggCratePriceSmall?: number;
  eggCratePriceLarge?: number;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
}

/**
 * Props for the SettingsClient component.
 */
interface SettingsClientProps {
  initialSettings: AlertSettings | undefined;
  systemSettings: SystemSettings | undefined;
  workspaces: Workspace[];
  workspaceId: string;
}

/**
 * SettingsClient component for configuring platform settings.
 *
 * @param props - Component properties.
 */
export function SettingsClient({ initialSettings, systemSettings, workspaceId }: SettingsClientProps) {
  const router = useRouter();
  
  // Alert Settings
  const [feedThresholdKg, setFeedThresholdKg] = useState(String(initialSettings?.feedThresholdKg || 50));
  const [eggDropPercentage, setEggDropPercentage] = useState(String(initialSettings?.eggDropPercentage || 15));
  const [notifySms, setNotifySms] = useState(initialSettings?.notifySms || false);
  const [notifyEmail, setNotifyEmail] = useState(initialSettings?.notifyEmail || false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(initialSettings?.notifyWhatsapp || false);

  // System Settings
  const [eggCratePriceSmall, setEggCratePriceSmall] = useState(String(systemSettings?.eggCratePriceSmall || 4200));
  const [eggCratePriceLarge, setEggCratePriceLarge] = useState(String(systemSettings?.eggCratePriceLarge || 4400));
  const [adminName, setAdminName] = useState(systemSettings?.adminName || 'Farm Admin');
  const [adminEmail, setAdminEmail] = useState(systemSettings?.adminEmail || 'admin@example.com');
  const [adminPhone, setAdminPhone] = useState(systemSettings?.adminPhone || '+2340000000000');

  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveAlertSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedThresholdKg: Number(feedThresholdKg),
          eggDropPercentage: Number(eggDropPercentage),
          notifySms,
          notifyEmail,
          notifyWhatsapp
        })
      });
      if (res.ok) {
        toast.success('Alert settings saved successfully!');
        router.refresh();
      }
      else toast.error('Failed to save alert settings');
    } catch (_err) {
      toast.error('Error saving settings');
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'system',
          id: systemSettings?.id,
          eggCratePriceSmall: Number(eggCratePriceSmall),
          eggCratePriceLarge: Number(eggCratePriceLarge),
          adminName,
          adminEmail,
          adminPhone
        })
      });
      if (res.ok) {
        toast.success('System settings saved successfully!');
        router.refresh();
      }
      else toast.error('Failed to save system settings');
    } catch (_err) {
      toast.error('Error saving system settings');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (workspaceId === 'main') {
      toast.error("Cannot delete the main workspace.");
      return;
    }
    if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces?id=${workspaceId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Workspace deleted successfully');
        // Delete cookie and redirect
        document.cookie = "pfms_workspace=main; path=/; max-age=31536000";
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete workspace');
      }
    } catch (_error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={32} className="text-indigo-600" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Platform Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your farm alert thresholds, profile, and pricing.</p>
        </div>
      </div>

      {/* Profile & Pricing */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
            <User size={18} className="text-green-500" /> Profile & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="Admin Name" fullWidth variant="outlined" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            <TextField label="Admin Email" type="email" fullWidth variant="outlined" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <TextField label="Admin Phone" fullWidth variant="outlined" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
            
            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-3 flex items-center gap-1">
                <DollarSign size={14} /> Egg Pricing Configuration
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Egg Price Per Crate (Small) - ₦" type="number" fullWidth variant="outlined" value={eggCratePriceSmall} onChange={(e) => setEggCratePriceSmall(e.target.value)} />
                <TextField label="Egg Price Per Crate (Large) - ₦" type="number" fullWidth variant="outlined" value={eggCratePriceLarge} onChange={(e) => setEggCratePriceLarge(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="pt-6 flex justify-end">
            <MuiButton onClick={handleSaveSystemSettings} variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
              Save Profile & Pricing
            </MuiButton>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
            <BellRing size={18} className="text-blue-500" /> Thresholds & Alerts Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField label="Feed Shortfall Critical Threshold (kg)" type="number" fullWidth variant="outlined" value={feedThresholdKg} onChange={(e) => setFeedThresholdKg(e.target.value)} helperText="Triggers critical dashboard/feed warnings when feed drops below this level." />
            <TextField label="Egg Output Drop Percentage Warning limit (%)" type="number" fullWidth variant="outlined" value={eggDropPercentage} onChange={(e) => setEggDropPercentage(e.target.value)} helperText="Warns if egg collection dips by more than this percentage." />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Automated Alert Dispatch Channels</p>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <FormControlLabel control={<Checkbox checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">Instant SMS Alerts</span>} />
              <FormControlLabel control={<Checkbox checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">Email Digest</span>} />
              <FormControlLabel control={<Checkbox checked={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.checked)} sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />} label={<span className="text-sm font-medium text-slate-700">WhatsApp Business Pings</span>} />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <MuiButton onClick={handleSaveAlertSettings} variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}>
              Save Alert Configuration
            </MuiButton>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Subscription */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-sm font-semibold uppercase text-slate-700 flex items-center gap-2">
            <DollarSign size={18} className="text-indigo-600" /> Subscription & Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-slate-900">Current Plan: Free Starter</h3>
              <p className="text-sm text-slate-500 mt-1">Upgrade to Commercial Pro to unlock unlimited branches, CCTV, and Voice AI.</p>
            </div>
            <MuiButton 
              onClick={() => router.push('/pricing')} 
              variant="contained" 
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, px: 4, py: 1.5, boxShadow: 'none' }}
            >
              Upgrade Plan
            </MuiButton>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-100">
        <CardHeader className="border-b border-red-50 bg-red-50/50">
          <CardTitle className="text-sm font-semibold uppercase text-red-600 flex items-center gap-2">
            <Trash2 size={18} /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-slate-900">Delete Current Workspace</h3>
              <p className="text-sm text-slate-500 mt-1">Permanently remove this workspace and all its data. This action is irreversible.</p>
            </div>
            <MuiButton 
              disabled={workspaceId === 'main' || isDeleting}
              onClick={handleDeleteWorkspace} 
              variant="outlined" 
              color="error"
              sx={{ borderRadius: 2, px: 4, py: 1.5 }}
            >
              {workspaceId === 'main' ? 'Cannot Delete Main Workspace' : isDeleting ? 'Deleting...' : 'Delete Workspace'}
            </MuiButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
