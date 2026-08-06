'use strict';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

export async function POST() {
  try {
    const workspaceId = await getWorkspaceId();

    if (!workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Update systemSettings table in Supabase
    const { data: existingSettings } = await supabase
      .from('systemSettings')
      .select('*')
      .eq('workspaceId', workspaceId)
      .limit(1)
      .maybeSingle();

    if (existingSettings) {
      await supabase
        .from('systemSettings')
        .update({ 
          subscriptionTier: 'free',
          plan: 'free',
          cctvEnabled: false,
          aiLoggerEnabled: false,
          exportReportsEnabled: false
        })
        .eq('workspaceId', workspaceId);
    } else {
      await supabase
        .from('systemSettings')
        .insert([{
          id: 'sys-' + Date.now().toString().slice(-6),
          workspaceId,
          subscriptionTier: 'free',
          plan: 'free',
          cctvEnabled: false,
          aiLoggerEnabled: false,
          exportReportsEnabled: false
        }]);
    }

    // 2. Log cancellation in alertLogs
    await supabase.from('alertLogs').insert([{
      id: 'al' + Date.now().toString().slice(-8),
      workspaceId,
      date: new Date().toISOString().split('T')[0],
      message: `SUBSCRIPTION CANCELLED: Workspace plan downgraded to Free Starter.`,
      severity: 'Warning',
      read: false
    }]);

    const response = NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled. Account downgraded to Free Starter.' 
    });

    response.cookies.set('pfms_tier', 'free', { path: '/', maxAge: 86400 * 30 });
    return response;
  } catch (err: any) {
    console.error('Subscription cancellation error:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
