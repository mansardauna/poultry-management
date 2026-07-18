'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/** Exported function GET */
export async function GET() {
  const [
    batches, eggs, feeds, feedLogs, staff, sales, expenses, cushionAudits, maturationLogs,
    procurePipeline, cctvLogs, invoices, tasks, alertSettingsRecords, alertLogs, mortalityLogs,
    medicationTemplates, medicationSchedules, payrollLogs, equipment, contacts, farmPens
  ] = await Promise.all([
    supabase.from('batches').select('*'),
    supabase.from('eggs').select('*'),
    supabase.from('feeds').select('*'),
    supabase.from('feedLogs').select('*'),
    supabase.from('staff').select('*'),
    supabase.from('sales').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('cushionAudits').select('*'),
    supabase.from('maturationLogs').select('*'),
    supabase.from('procurePipeline').select('*'),
    supabase.from('cctvLogs').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('alertSettings').select('*'),
    supabase.from('alertLogs').select('*'),
    supabase.from('mortalityLogs').select('*'),
    supabase.from('medicationTemplates').select('*'),
    supabase.from('medicationSchedules').select('*'),
    supabase.from('payrollLogs').select('*'),
    supabase.from('equipment').select('*'),
    supabase.from('contacts').select('*'),
    supabase.from('farmPens').select('*')
  ]);

  const alertSettings = alertSettingsRecords.data?.[0] || {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true
  };

  return NextResponse.json({
    batches: batches.data || [], 
    eggs: eggs.data || [], 
    feeds: feeds.data || [], 
    feedLogs: feedLogs.data || [], 
    staff: staff.data || [], 
    sales: sales.data || [], 
    expenses: expenses.data || [],
    cushionAudits: cushionAudits.data || [], 
    maturationLogs: maturationLogs.data || [], 
    procurePipeline: procurePipeline.data || [], 
    cctvLogs: cctvLogs.data || [],
    invoices: invoices.data || [], 
    tasks: tasks.data || [], 
    alertSettings, 
    alertLogs: alertLogs.data || [], 
    mortalityLogs: mortalityLogs.data || [],
    medicationTemplates: medicationTemplates.data || [], 
    medicationSchedules: medicationSchedules.data || [], 
    payrollLogs: payrollLogs.data || [],
    equipment: equipment.data || [], 
    contacts: contacts.data || [], 
    farmPens: farmPens.data || []
  });
}
