'use strict';
import { supabase } from "@/lib/supabase";
import { SettingsClient } from "@/components/features/settings/SettingsClient";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/auth";

/** Exported function default */
export default async function SettingsPage() {
  const workspaceId = await getWorkspaceId();
  
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  const alertSettings = (await supabase.from('alertSettings').select('*').eq('workspaceId', workspaceId).limit(1)).data?.[0] ?? {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true,
  };

  const rawSystemSettings = (await supabase.from('systemSettings').select('*').eq('workspaceId', workspaceId).limit(1)).data?.[0];
  const systemSettings = rawSystemSettings ? {
    ...rawSystemSettings,
    eggCratePriceSmall: rawSystemSettings.eggCratePriceSmall ?? 4200,
    eggCratePriceLarge: rawSystemSettings.eggCratePriceLarge ?? 4400,
    adminName: rawSystemSettings.adminName || (user?.email ? user.email.split('@')[0] : 'Farm Owner'),
    adminEmail: rawSystemSettings.adminEmail || user?.email || '',
    adminPhone: rawSystemSettings.adminPhone || '',
    farmName: rawSystemSettings.farmName || '',
    billingRegion: rawSystemSettings.billingRegion || 'Nigeria & West Africa (NGN)',
  } : {
    id: 'default',
    workspaceId,
    eggCratePriceSmall: 4200,
    eggCratePriceLarge: 4400,
    adminName: user?.email ? user.email.split('@')[0] : 'Farm Owner',
    adminEmail: user?.email || '',
    adminPhone: '',
    farmName: '',
    billingRegion: 'Nigeria & West Africa (NGN)'
  };

  const workspaces = (await supabase.from('workspaces').select('*')).data || [];
  const paymentMethods = (await supabase.from('payment_methods').select('*').eq('workspaceId', workspaceId)).data || [];
  const { data: rawHist } = await supabase.from('subscription_history').select('*').order('createdAt', { ascending: false });
  const subscriptionHistory = rawHist || [];

  return <SettingsClient 
    initialSettings={alertSettings} 
    systemSettings={systemSettings} 
    initialPaymentMethods={paymentMethods}
    initialSubscriptionHistory={subscriptionHistory}
    workspaces={workspaces} 
    workspaceId={workspaceId} 
  />;
}
