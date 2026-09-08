'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [
    { data: sales },
    { data: expenses },
    { data: invoices }
  ] = await Promise.all([
    supabase.from('sales').select('*').eq('workspaceId', workspaceId),
    supabase.from('expenses').select('*').eq('workspaceId', workspaceId),
    supabase.from('invoices').select('*').eq('workspaceId', workspaceId)
  ]);
  return NextResponse.json({
    sales: sales || [],
    expenses: expenses || [],
    invoices: invoices || []
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'payroll') {
      let totalDisbursement = 0;
      
      const { data: staffList } = await supabase.from('staff').select('*').eq('workspaceId', workspaceId);
      
      if (staffList) {
        for (const member of staffList) {
          const pay = member.salary;
          totalDisbursement += pay;
          
          await supabase.from('expenses').insert([{
            id: 'ex-' + Date.now() + '-' + member.id,
            workspaceId,
            date: body.date || new Date().toISOString().split('T')[0],
            category: 'Salaries',
            amount: pay,
            description: `Staff Payroll Disbursement: ${member.name} (${member.role}) - Attendance: ${member.attendanceDays} days`
          }]);

          await supabase.from('payrollLogs').insert([{
            id: `PRL-${Date.now()}-${member.id}`,
            workspaceId,
            date: body.date || new Date().toISOString().split('T')[0],
            staffId: member.id,
            amount: pay,
            period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          }]);
          
          await supabase.from('staff').update({ attendanceDays: 0 }).eq('id', member.id).eq('workspaceId', workspaceId);
        }
      }
      
      await supabase.from('alertLogs').insert([{
        id: 'al-' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Processed payroll for ${staffList?.length || 0} staff member(s). Total disbursements: ₦${totalDisbursement.toLocaleString()}`,
        severity: 'Info'
      }]);
      
      return NextResponse.json({ success: true, totalDisbursement });
    }
    
    // Default action: add expense
    const newExpense = {
      id: 'ex-' + Date.now(),
      workspaceId,
      date: body.date || new Date().toISOString().split('T')[0],
      category: body.category || 'Feed',
      amount: Number(body.amount),
      description: body.description || ''
    };
    
    await supabase.from('expenses').insert([newExpense]);
    
    await supabase.from('alertLogs').insert([{
      id: 'al-' + Date.now(),
      workspaceId,
      date: new Date().toISOString().split('T')[0],
      message: `EXPENSE OUTFLOW: Recorded ₦${newExpense.amount.toLocaleString()} for ${newExpense.category} (${newExpense.description})`,
      severity: 'Info'
    }]);
    
    return NextResponse.json(newExpense, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('expenses').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('expenses').delete().eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
