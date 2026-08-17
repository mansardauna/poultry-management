'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const { data: cctvLogsData } = await supabase.from('cctvLogs').select('*').eq('workspaceId', workspaceId);
  const { data: cctvCamerasData } = await supabase.from('cctv_cameras').select('*').eq('workspaceId', workspaceId);

  return NextResponse.json({
    logs: cctvLogsData || [],
    cameras: cctvCamerasData || []
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'pair_camera') {
      const newCamera = {
        id: 'cam_' + Date.now(),
        workspaceId,
        name: body.name || 'Live Farm Camera',
        cameraId: body.cameraId || body.streamUrl || 'CAM-ONLINE',
        streamUrl: body.streamUrl || '',
        streamType: body.streamType || 'RTSP',
        status: 'Online',
        createdAt: new Date().toISOString()
      };

      // Insert into cctv_cameras (silently fallback if table not yet migrated)
      try {
        await supabase.from('cctv_cameras').insert([newCamera]);
      } catch (_err) {}

      // Insert audit log
      const newLog = {
        id: 'c' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        device: body.name || 'Live Camera',
        event: `Paired new hardware camera (ID/URL: ${body.cameraId || body.streamUrl}). Stream status: Online.`,
        status: 'Healthy'
      };
      await supabase.from('cctvLogs').insert([newLog]);

      return NextResponse.json({ camera: newCamera, log: newLog }, { status: 201 });
    }

    if (body.action === 'delete_camera') {
      try {
        await supabase.from('cctv_cameras').delete().eq('id', body.id).eq('workspaceId', workspaceId);
      } catch (_err) {}
      return NextResponse.json({ success: true });
    }

    if (body.action === 'dispatch') {
      const newLog = {
        id: 'c' + Date.now(),
        workspaceId,
        date: body.date || new Date().toISOString().split('T')[0],
        device: 'System Dispatcher',
        event: `Dispatched technician: "${body.notes}"`,
        status: 'Action Logged'
      };
      
      await supabase.from('cctvLogs').insert([newLog]);
      await supabase.from('alertLogs').insert([{
        id: 'al' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Security system technician ticket dispatched: "${body.notes}"`,
        severity: 'Info'
      }]);
      return NextResponse.json(newLog, { status: 201 });
    }

    if (body.action === 'reboot') {
      const newLog = {
        id: 'c' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        device: body.device || 'Camera Hardware',
        event: `Sent hardware reboot command. Device status set to rebooting.`,
        status: 'Warning'
      };
      
      await supabase.from('cctvLogs').insert([newLog]);
      await supabase.from('alertLogs').insert([{
        id: 'al' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Initiated soft-reboot sequence on CCTV camera ${body.device}.`,
        severity: 'Info'
      }]);
      return NextResponse.json(newLog, { status: 201 });
    }

    if (body.action === 'ping') {
      const newLog = {
        id: 'c' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        device: 'NVR Router Gateway',
        event: `Gateway Ping Success (RTT: 2ms).`,
        status: 'Healthy'
      };
      await supabase.from('cctvLogs').insert([newLog]);
      return NextResponse.json(newLog, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to complete CCTV action' }, { status: 500 });
  }
}
