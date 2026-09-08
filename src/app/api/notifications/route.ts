'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const { data: notifications } = await supabase.from('alertLogs').select('*').eq('workspaceId', workspaceId).order('date', { ascending: false });
    const formatted = (notifications || []).map((log: any) => ({
      ...log,
      read: log.read ?? false,
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    if (body.action === 'markAllRead') {
      await supabase.from('alertLogs').update({ read: true }).eq('workspaceId', workspaceId);
    } else if (body.id) {
      await supabase.from('alertLogs').update({ read: true }).eq('id', body.id).eq('workspaceId', workspaceId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
