'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  if (workspaceId === '__unauthenticated__') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [farmPensRes, batchesRes] = await Promise.all([
    applyWorkspaceFilter(supabase.from('farmPens').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId)
  ]);
  const farmPens = (farmPensRes.data || []).map((p: any) => {
    let temperatureLogs = p.temperatureLogs;
    if (typeof temperatureLogs === 'string') {
      try {
        temperatureLogs = JSON.parse(temperatureLogs);
      } catch {
        temperatureLogs = [];
      }
    }
    if (!Array.isArray(temperatureLogs)) {
      temperatureLogs = [];
    }
    return {
      ...p,
      capacity: Number(p.capacity || 0),
      temperatureLogs
    };
  });
  return NextResponse.json({
    farmPens,
    batches: batchesRes.data || []
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    if (workspaceId === '__unauthenticated__') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();

    // Check if logging temperature
    if (body.action === 'logTemperature') {
      const penId = body.penId;
      const tempCelsius = Number(body.tempCelsius ?? body.tempC);
      if (!penId) {
        return NextResponse.json({ error: 'Pen ID is required' }, { status: 400 });
      }
      if (isNaN(tempCelsius)) {
        return NextResponse.json({ error: 'Valid temperature is required' }, { status: 400 });
      }

      const { data: penRows } = await supabase.from('farmPens').select('*').eq('id', penId).eq('workspaceId', workspaceId);
      if (!penRows || penRows.length === 0) {
        return NextResponse.json({ error: 'Pen not found' }, { status: 404 });
      }
      const pen = penRows[0];

      let existingLogs: any[] = [];
      if (Array.isArray(pen.temperatureLogs)) {
        existingLogs = [...pen.temperatureLogs];
      } else if (typeof pen.temperatureLogs === 'string') {
        try {
          existingLogs = JSON.parse(pen.temperatureLogs) || [];
        } catch {
          existingLogs = [];
        }
      }

      const now = new Date();
      const newLog = {
        id: 'tlog-' + Date.now(),
        date: body.date || now.toISOString().split('T')[0],
        time: body.time || now.toTimeString().slice(0, 5),
        tempCelsius,
        humidity: body.humidity !== undefined && body.humidity !== '' && body.humidity !== null ? Number(body.humidity) : null,
        notes: body.notes || '',
        recordedBy: body.recordedBy || 'Staff'
      };

      // Put latest first
      const updatedLogs = [newLog, ...existingLogs];

      const { error: updateErr } = await supabase.from('farmPens').update({
        temperatureLogs: updatedLogs
      }).eq('id', penId).eq('workspaceId', workspaceId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Check temperature thresholds: safe range is 18°C - 30°C
      if (tempCelsius > 30 || tempCelsius < 18) {
        const isCritical = tempCelsius >= 34 || tempCelsius <= 15;
        const severity = isCritical ? 'Critical' : 'Warning';
        const alertMsg = tempCelsius > 30
          ? `${severity.toUpperCase()}: High temperature of ${tempCelsius}°C recorded in ${pen.name} (exceeds 30°C optimal threshold). Risk of heat stress.`
          : `${severity.toUpperCase()}: Low temperature of ${tempCelsius}°C recorded in ${pen.name} (below 18°C optimal threshold). Risk of chilling.`;

        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now(),
          workspaceId,
          date: newLog.date,
          message: alertMsg,
          severity
        }]);

        // Auto-assign corrective task
        const { data: staffMembers } = await supabase
          .from('staff')
          .select('name, role')
          .eq('workspaceId', workspaceId);
        const assignedStaff = staffMembers?.find((s: any) => s.role === 'Manager' || s.role === 'Staff')?.name ||
          staffMembers?.[0]?.name ||
          'Farm Supervisor';

        await supabase.from('tasks').insert([{
          id: 't-' + Date.now().toString().slice(-8),
          workspaceId,
          assignedTo: assignedStaff,
          taskName: `Regulate temperature in ${pen.name}: Current ${tempCelsius}°C (Target: 20-25°C)`,
          status: 'Pending',
          date: newLog.date
        }]);
      }

      return NextResponse.json({
        success: true,
        log: newLog,
        pen: {
          ...pen,
          capacity: Number(pen.capacity || 0),
          temperatureLogs: updatedLogs
        }
      }, { status: 201 });
    }
    
    // We assume farmPens auto-generates id or we handle it
    const newPen = {
      id: 'p-' + Date.now(),
      workspaceId,
      name: body.name,
      capacity: Number(body.capacity) || 0,
      currentBatchId: body.currentBatchId || null,
      status: body.status || 'Active',
      temperatureLogs: body.temperatureLogs || []
    };
    
    const { error } = await supabase.from('farmPens').insert([newPen]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(newPen, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process housing request: ' + (err?.message || String(err)) }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    if (workspaceId === '__unauthenticated__') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('farmPens').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, ...body });
  } catch {
    return NextResponse.json({ error: 'Failed to update pen' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    if (workspaceId === '__unauthenticated__') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('farmPens').delete().eq('id', id).eq('workspaceId', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete pen: ' + (err?.message || String(err)) }, { status: 500 });
  }
}
