'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';

/** Exported function GET */
export async function GET() {
  const batches = await db.select().from(schema.batches);
  const eggs = await db.select().from(schema.eggs);
  const feeds = await db.select().from(schema.feeds);
  const feedLogs = await db.select().from(schema.feedLogs);
  const staff = await db.select().from(schema.staff);
  const sales = await db.select().from(schema.sales);
  const expenses = await db.select().from(schema.expenses);
  const cushionAudits = await db.select().from(schema.cushionAudits);
  const maturationLogs = await db.select().from(schema.maturationLogs);
  const procurePipeline = await db.select().from(schema.procurePipeline);
  const cctvLogs = await db.select().from(schema.cctvLogs);
  const invoices = await db.select().from(schema.invoices);
  const tasks = await db.select().from(schema.tasks);
  const alertSettingsRecords = await db.select().from(schema.alertSettings);
  const alertSettings = alertSettingsRecords[0] || {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true
  };
  const alertLogs = await db.select().from(schema.alertLogs);
  const mortalityLogs = await db.select().from(schema.mortalityLogs);
  const medicationTemplates = await db.select().from(schema.medicationTemplates);
  const medicationSchedules = await db.select().from(schema.medicationSchedules);
  const payrollLogs = await db.select().from(schema.payrollLogs);
  const equipment = await db.select().from(schema.equipment);
  const contacts = await db.select().from(schema.contacts);
  const farmPens = await db.select().from(schema.farmPens);

  return NextResponse.json({
    batches, eggs, feeds, feedLogs, staff, sales, expenses,
    cushionAudits, maturationLogs, procurePipeline, cctvLogs,
    invoices, tasks, alertSettings, alertLogs, mortalityLogs,
    medicationTemplates, medicationSchedules, payrollLogs,
    equipment, contacts, farmPens
  });
}
