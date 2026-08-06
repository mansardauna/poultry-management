'use strict';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

/**
 * Smart Poultry Natural Language Regex Fallback Parser
 * Parses natural language input into structured farm records if Gemini API is offline.
 */
function smartParsePoultryText(text: string, today: string) {
  const textLower = text.toLowerCase();
  const result: any = {
    eggs: [],
    expenses: [],
    sales: [],
    staffChanges: { add: [], removeAll: false }
  };

  // 1. Detect Egg Collection (e.g., "30 crates of eggs", "collected 15 crates", "500 eggs")
  const eggCrateMatch = textLower.match(/(\d+)\s*(crates|crate)\s*(of\s*eggs)?/);
  const eggPiecesMatch = textLower.match(/(\d+)\s*(eggs|pieces)/);
  let totalEggs = 0;
  let crackedEggs = 0;

  if (eggCrateMatch) {
    totalEggs += parseInt(eggCrateMatch[1], 10) * 30;
  }
  if (eggPiecesMatch) {
    totalEggs += parseInt(eggPiecesMatch[1], 10);
  }

  const crackedMatch = textLower.match(/(\d+)\s*(cracked|broken|spoilt)/);
  if (crackedMatch) {
    crackedEggs = parseInt(crackedMatch[1], 10);
  }

  if (totalEggs > 0) {
    result.eggs.push({
      date: today,
      goodEggs: Math.max(0, totalEggs - crackedEggs),
      crackedEggs: crackedEggs,
      notes: 'AI Auto-Logged'
    });
  }

  // 2. Detect Sales (e.g., "sold 15 crates for 75000", "sold 5 birds for 25000 naira", "sales 50k")
  const salesMatch = textLower.match(/(sold|sale|sales)\s*(\d+)?\s*(crates|birds|chickens|eggs)?\s*(for|at|of)?\s*(₦|\$|naira)?\s*(\d+[\d,]*)(k)?/i);
  if (salesMatch) {
    let qty = salesMatch[2] ? parseInt(salesMatch[2], 10) : 1;
    let type = salesMatch[3] ? salesMatch[3].charAt(0).toUpperCase() + salesMatch[3].slice(1) : 'Eggs';
    let rawAmt = salesMatch[6].replace(/,/g, '');
    let amt = parseInt(rawAmt, 10);
    if (salesMatch[7] && salesMatch[7].toLowerCase() === 'k') {
      amt *= 1000;
    }

    result.sales.push({
      date: today,
      type: type,
      quantity: qty,
      totalAmount: amt || 0,
      customerName: 'Walk-in Customer'
    });
  }

  // 3. Detect Expenses & Feed Purchase (e.g., "bought feed for 45000", "bought 3 bags feed", "spent 20000 on vaccine")
  const expenseMatch = textLower.match(/(bought|spent|paid|expense|purchased)\s*([a-z\s]+)?\s*(for|at|of)?\s*(₦|\$|naira)?\s*(\d+[\d,]*)(k)?/i);
  if (expenseMatch) {
    let rawCategory = expenseMatch[2] ? expenseMatch[2].trim() : 'Maintenance';
    let category = 'Maintenance';
    if (rawCategory.includes('feed')) category = 'Feed';
    else if (rawCategory.includes('drug') || rawCategory.includes('vaccine') || rawCategory.includes('med')) category = 'Drugs';
    else if (rawCategory.includes('salary') || rawCategory.includes('staff') || rawCategory.includes('pay')) category = 'Salaries';
    else if (rawCategory.includes('fuel') || rawCategory.includes('light') || rawCategory.includes('power')) category = 'Utilities';

    let rawAmt = expenseMatch[5].replace(/,/g, '');
    let amt = parseInt(rawAmt, 10);
    if (expenseMatch[6] && expenseMatch[6].toLowerCase() === 'k') {
      amt *= 1000;
    }

    result.expenses.push({
      date: today,
      category: category,
      amount: amt || 0,
      description: text
    });
  }

  return result;
}

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

    const today = new Date().toISOString().split('T')[0];
    let parsed: any = null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are a Poultry Farm Management AI Assistant. Your job is to extract data from natural language daily reports and output them in strict JSON format. 
Here are the farm rules:
- 1 crate of eggs = 30 pieces. If the user says "3 crates and 12 pieces", that means (3 * 30) + 12 = 102 pieces. Always convert egg counts into total pieces.
- If a date is not specified, use today's date: ${today}.
- Interpret words like "yesterday", "sunday", "monday" into exact YYYY-MM-DD dates (assuming today is ${today}).
- Expense categories must be one of: "Feed", "Drugs", "Salaries", "Maintenance", "Utilities".

Return a JSON object with this exact structure (use empty arrays if no data of that type exists in the text):
{
  "staffChanges": { "removeAll": false, "add": [] },
  "eggs": [ { "date": "YYYY-MM-DD", "goodEggs": number, "crackedEggs": number, "notes": "string" } ],
  "expenses": [ { "date": "YYYY-MM-DD", "category": "string", "amount": number, "description": "string" } ],
  "sales": [ { "date": "YYYY-MM-DD", "type": "string", "quantity": number, "totalAmount": number, "customerName": "string" } ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: text,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          }
        });

        if (response.text) {
          parsed = JSON.parse(response.text);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to smart NLP parser:', geminiError);
      }
    }

    if (!parsed) {
      parsed = smartParsePoultryText(text, today);
    }

    // Process and save records into Supabase tables under active workspaceId

    // 1. Handle Staff
    if (parsed.staffChanges?.removeAll) {
      await serviceRoleClient.from('staff').delete().eq('workspaceId', workspaceId);
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
      await serviceRoleClient.from('staff').insert(staffInsert);
    }

    // 2. Handle Eggs
    if (parsed.eggs?.length > 0) {
      const { data: batches } = await serviceRoleClient
        .from('batches')
        .select('id')
        .eq('workspaceId', workspaceId)
        .limit(1);
        
      let batchId = batches?.[0]?.id;
      
      if (!batchId) {
         batchId = crypto.randomUUID();
         await serviceRoleClient.from('batches').insert({
            id: batchId,
            workspaceId,
            name: 'AI Auto-Logged Batch',
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
      await serviceRoleClient.from('eggs').insert(eggInsert);
    }

    // 3. Handle Expenses
    if (parsed.expenses?.length > 0) {
      const expenseInsert = parsed.expenses.map((ex: any) => ({
        id: crypto.randomUUID(),
        workspaceId,
        date: ex.date || today,
        category: ex.category || 'Maintenance',
        amount: ex.amount || 0,
        description: ex.description || ''
      }));
      await serviceRoleClient.from('expenses').insert(expenseInsert);
    }

    // 4. Handle Sales
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
      await serviceRoleClient.from('sales').insert(salesInsert);
    }

    return NextResponse.json({ success: true, parsed });
  } catch (error: any) {
    console.error('AI Parse Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process AI parsing' }, { status: 500 });
  }
}
