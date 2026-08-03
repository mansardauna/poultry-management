'use strict';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const workspaceId = cookieStore.get('pfms_workspace')?.value;
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace found' }, { status: 400 });
    }

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text report is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in the environment.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const today = new Date().toISOString().split('T')[0];
    
    const systemPrompt = `You are a Poultry Farm Management AI Assistant. Your job is to extract data from natural language daily reports and output them in strict JSON format. 
Here are the farm rules:
- 1 crate of eggs = 30 pieces. If the user says "3 crates and 12 pieces", that means (3 * 30) + 12 = 102 pieces. Always convert egg counts into total pieces.
- If a date is not specified, use today's date: ${today}.
- Interpret words like "yesterday", "sunday", "monday" into exact YYYY-MM-DD dates (assuming today is ${today}).
- Expense categories must be one of: "Feed", "Drugs", "Salaries", "Maintenance", "Utilities".
  - Examples: "vaccine" = Drugs, "fuel" = Utilities, "fix generator" = Maintenance, "paid manager" = Salaries.

Return a JSON object with this exact structure (use empty arrays if no data of that type exists in the text):
{
  "staffChanges": {
    "removeAll": boolean,
    "add": [ { "name": "string", "role": "string", "salary": number, "contactInfo": "string" } ]
  },
  "eggs": [ { "date": "YYYY-MM-DD", "goodEggs": number, "crackedEggs": number, "notes": "string" } ],
  "expenses": [ { "date": "YYYY-MM-DD", "category": "string", "amount": number, "description": "string" } ],
  "medications": [ { "date": "YYYY-MM-DD", "name": "string", "notes": "string" } ],
  "feedUsedKg": number,
  "mortalityCount": number,
  "sales": [ { "date": "YYYY-MM-DD", "type": "string", "quantity": number, "totalAmount": number, "customerName": "string" } ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error("AI returned empty response");
    }

    const parsed = JSON.parse(response.text);

    // Handle staff changes
    if (parsed.staffChanges?.removeAll) {
      await supabase.from('staff').delete().eq('workspaceId', workspaceId);
    }
    if (parsed.staffChanges?.add?.length > 0) {
      const staffInsert = parsed.staffChanges.add.map((s: any) => ({
        id: crypto.randomUUID(),
        workspaceId,
        name: s.name,
        role: s.role || 'Staff',
        contact: s.contactInfo || '',
        salary: s.salary || 0,
        attendanceDays: 0
      }));
      const { error } = await supabase.from('staff').insert(staffInsert);
      if (error) console.error("Staff Insert Error:", error);
    }

    // Handle Eggs
    if (parsed.eggs?.length > 0) {
      const { data: batches } = await supabase
        .from('batches')
        .select('id')
        .eq('workspaceId', workspaceId)
        .limit(1);
        
      let batchId = batches?.[0]?.id;
      
      if (!batchId) {
         batchId = crypto.randomUUID();
         await supabase.from('batches').insert({
            id: batchId,
            workspaceId,
            name: 'AI Generated Batch',
            type: 'Layers',
            quantity: 100,
            startDate: today,
            status: 'Active'
         });
      }

      const eggInsert = parsed.eggs.map((e: any) => ({
        id: crypto.randomUUID(),
        workspaceId,
        batchId,
        date: e.date || today,
        goodEggs: e.goodEggs || 0,
        brokenEggs: e.crackedEggs || 0,
        spoiltEggs: 0,
      }));
      const { error } = await supabase.from('eggs').insert(eggInsert);
      if (error) console.error("Eggs Insert Error:", error);
    }

    // Handle Expenses
    if (parsed.expenses?.length > 0) {
      const expenseInsert = parsed.expenses.map((ex: any) => ({
        id: crypto.randomUUID(),
        workspaceId,
        date: ex.date || today,
        category: ex.category || 'Maintenance',
        amount: ex.amount || 0,
        description: ex.description || ''
      }));
      const { error } = await supabase.from('expenses').insert(expenseInsert);
      if (error) console.error("Expenses Insert Error:", error);
    }

    // Handle Sales
    if (parsed.sales?.length > 0) {
      const salesInsert = parsed.sales.map((s: any) => ({
        id: crypto.randomUUID(),
        workspaceId,
        date: s.date || today,
        type: s.type || 'Eggs',
        quantity: s.quantity || 0,
        totalAmount: s.totalAmount || 0,
        customerName: s.customerName || 'Walk-in Customer',
        paymentMethod: 'Cash',
        status: 'Paid'
      }));
      const { error } = await supabase.from('sales').insert(salesInsert);
      if (error) console.error("Sales Insert Error:", error);
    }

    return NextResponse.json({ success: true, parsed });
  } catch (error: any) {
    console.error('AI Parse Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process AI parsing' }, { status: 500 });
  }
}
