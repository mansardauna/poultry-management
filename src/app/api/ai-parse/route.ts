'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text report is required' }, { status: 400 });
    }

    // Initialize Gemini SDK with API key (we will fall back to a mock if no key exists)
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
  "salesAmount": number
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

    await db.transaction(async (tx) => {
      // Handle staff changes
      if (parsed.staffChanges?.removeAll) {
        await tx.delete(schema.staff);
      }
      if (parsed.staffChanges?.add?.length > 0) {
        const staffInsert = parsed.staffChanges.add.map((s: any) => ({
          id: crypto.randomUUID(),
          workspaceId: 'main',
          name: s.name,
          role: s.role || 'Staff',
          contact: s.contactInfo || '',
          salary: s.salary || 0,
          hireDate: today,
          attendanceDays: 0,
          status: 'Active'
        }));
        await tx.insert(schema.staff).values(staffInsert);
      }

      // Handle Eggs
      if (parsed.eggs?.length > 0) {
        const eggInsert = parsed.eggs.map((e: any) => ({
          id: crypto.randomUUID(),
          workspaceId: 'main',
          batchId: 'batch-1',
          date: e.date || today,
          goodEggs: e.goodEggs || 0,
          brokenEggs: e.crackedEggs || 0,
          spoiltEggs: 0,
        }));
        await tx.insert(schema.eggs).values(eggInsert);
      }

      // Handle Expenses
      if (parsed.expenses?.length > 0) {
        const expenseInsert = parsed.expenses.map((ex: any) => ({
          id: crypto.randomUUID(),
          workspaceId: 'main',
          date: ex.date || today,
          category: ex.category || 'Maintenance',
          amount: ex.amount || 0,
          description: ex.description || ''
        }));
        await tx.insert(schema.expenses).values(expenseInsert);
      }

      // Handle Medications
      if (parsed.medications?.length > 0) {
        const medInsert = parsed.medications.map((m: any) => ({
          id: crypto.randomUUID(),
          workspaceId: 'main',
          batchId: 'batch-1',
          medicationName: m.name,
          type: 'Medication',
          scheduledDate: m.date || today,
          status: 'Completed',
          notes: m.notes || ''
        }));
        await tx.insert(schema.medicationSchedules).values(medInsert);
      }

      // Simple metrics
      if (parsed.feedUsedKg > 0) {
        await tx.insert(schema.feedLogs).values({
          id: crypto.randomUUID(),
          date: today,
          feedId: 'f1',
          quantityConsumedKg: parsed.feedUsedKg,
          batchId: 'batch-1'
        });
      }
      if (parsed.mortalityCount > 0) {
        const batchesData = await tx.select().from(schema.batches).limit(1);
        if (batchesData.length > 0) {
          await tx.update(schema.batches)
            .set({ mortalityCount: batchesData[0].mortalityCount + parsed.mortalityCount })
            .where(eq(schema.batches.id, batchesData[0].id));
        }
      }
      if (parsed.salesAmount > 0) {
        await tx.insert(schema.sales).values({
          id: crypto.randomUUID(),
          date: today,
          type: 'Eggs',
          quantity: 50,
          totalAmount: parsed.salesAmount,
          customerName: 'AI Log Customer',
          paymentMethod: 'Bank transfer',
          status: 'Paid'
        });
      }
    });

    return NextResponse.json({
      success: true,
      extracted: parsed
    });
  } catch (err: any) {
    console.error('AI Parse Error:', err);
    return NextResponse.json({ error: 'Failed to process AI report', details: err.message }, { status: 500 });
  }
}
