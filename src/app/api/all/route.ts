'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';

/** Exported function GET */
export async function GET() {
  const [
    batches, eggs, feeds, feedLogs, staff, sales, expenses, cushionAudits, maturationLogs,
    procurePipeline, cctvLogs, invoices, tasks, alertSettingsRecords, alertLogs, mortalityLogs,
    medicationTemplates, medicationSchedules, payrollLogs, equipment, contacts, farmPens
  ] = await Promise.all([
    db.select().from(schema.batches),
    db.select().from(schema.eggs),
    db.select().from(schema.feeds),
    db.select().from(schema.feedLogs),
    db.select().from(schema.staff),
    db.select().from(schema.sales),
    db.select().from(schema.expenses),
    db.select().from(schema.cushionAudits),
    db.select().from(schema.maturationLogs),
    db.select().from(schema.procurePipeline),
    db.select().from(schema.cctvLogs),
    db.select().from(schema.invoices),
    db.select().from(schema.tasks),
    db.select().from(schema.alertSettings),
    db.select().from(schema.alertLogs),
    db.select().from(schema.mortalityLogs),
    db.select().from(schema.medicationTemplates),
    db.select().from(schema.medicationSchedules),
    db.select().from(schema.payrollLogs),
    db.select().from(schema.equipment),
    db.select().from(schema.contacts),
    db.select().from(schema.farmPens)
  ]);

  const alertSettings = alertSettingsRecords[0] || {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true
  };

  return NextResponse.json({
    batches, eggs, feeds, feedLogs, staff, sales, expenses,
    cushionAudits, maturationLogs, procurePipeline, cctvLogs,
    invoices, tasks, alertSettings, alertLogs, mortalityLogs,
    medicationTemplates, medicationSchedules, payrollLogs,
    equipment, contacts, farmPens
  });
}
