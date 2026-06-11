import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [sales, expenses, invoices] = await Promise.all([
    db.select().from(schema.sales).where(eq(schema.sales.workspaceId, workspaceId)),
    db.select().from(schema.expenses).where(eq(schema.expenses.workspaceId, workspaceId)),
    db.select().from(schema.invoices).where(eq(schema.invoices.workspaceId, workspaceId))
  ]);
  return NextResponse.json({
    sales,
    expenses,
    invoices
  });
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'payroll') {
      let totalDisbursement = 0;
      
      await db.transaction(async (tx) => {
        const staffList = await tx.select().from(schema.staff).where(eq(schema.staff.workspaceId, workspaceId));
        
        for (const member of staffList) {
          const pay = member.salary;
          totalDisbursement += pay;
          
          await tx.insert(schema.expenses).values({
            id: 'ex-' + Date.now() + '-' + member.id,
            workspaceId,
            date: body.date || new Date().toISOString().split('T')[0],
            category: 'Salaries',
            amount: pay,
            description: `Staff Payroll Disbursement: ${member.name} (${member.role}) - Attendance: ${member.attendanceDays} days`
          });

          await tx.insert(schema.payrollLogs).values({
            id: `PRL-${Date.now()}-${member.id}`,
            workspaceId,
            date: body.date || new Date().toISOString().split('T')[0],
            staffId: member.id,
            amount: pay,
            period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          });
          
          await tx.update(schema.staff).set({ attendanceDays: 0 }).where(and(eq(schema.staff.id, member.id), eq(schema.staff.workspaceId, workspaceId)));
        }
        
        await tx.insert(schema.alertLogs).values({
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `INFO: Processed payroll for ${staffList.length} staff member(s). Total disbursements: ₦${totalDisbursement.toLocaleString()}`,
          severity: 'Info'
        });
      });
      
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
    
    await db.transaction(async (tx) => {
      await tx.insert(schema.expenses).values(newExpense);
      
      await tx.insert(schema.alertLogs).values({
        id: 'al-' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `EXPENSE OUTFLOW: Recorded ₦${newExpense.amount.toLocaleString()} for ${newExpense.category} (${newExpense.description})`,
        severity: 'Info'
      });
    });
    
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.update(schema.expenses).set(fields).where(and(eq(schema.expenses.id, id), eq(schema.expenses.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(schema.expenses).where(and(eq(schema.expenses.id, id), eq(schema.expenses.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
