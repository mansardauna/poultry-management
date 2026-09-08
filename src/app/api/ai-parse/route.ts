'use strict';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

/**
 * Smart Poultry Natural Language Parser
 */
function smartParsePoultryText(text: string, today: string) {
  const textLower = text.toLowerCase();
  const result: any = {
    eggs: [],
    expenses: [],
    sales: [],
    feedUsedKg: 0,
    mortalityCount: 0,
    staffChanges: { add: [], removeAll: false }
  };

  // Egg Collection (e.g. "collected 4500 good eggs, but 12 were cracked", "30 crates")
  const eggCrateMatch = textLower.match(/(\d+)\s*(crates|crate)/);
  const eggPiecesMatch = textLower.match(/(\d+)\s*(good\s*)?(eggs|pieces)/);
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

  // Mortality (e.g., "3 birds died", "mortality 3")
  const mortalityMatch = textLower.match(/(\d+)\s*(birds|chickens|hens)?\s*(died|mortality|dead)/);
  if (mortalityMatch) {
    result.mortalityCount = parseInt(mortalityMatch[1], 10);
  }

  // Feed Used (e.g. "feed 200kg", "used 2 bags feed")
  const feedMatch = textLower.match(/(\d+)\s*(kg|bags|bags of feed|kg feed)/);
  if (feedMatch) {
    let feedQty = parseInt(feedMatch[1], 10);
    if (textLower.includes('bag')) feedQty *= 25;
    result.feedUsedKg = feedQty;
  }

  // Expenses (e.g. "spent 250000 on drugs")
  const expenseMatch = textLower.match(/(spent|bought|paid|purchased|expense)\s*(₦|\$|naira)?\s*(\d+[\d,]*)(k)?\s*(on|for)?\s*([a-z\s]+)?/i);
  if (expenseMatch) {
    let rawAmt = expenseMatch[3].replace(/,/g, '');
    let amt = parseInt(rawAmt, 10);
    if (expenseMatch[4] && expenseMatch[4].toLowerCase() === 'k') amt *= 1000;
    
    let desc = expenseMatch[6] ? expenseMatch[6].trim() : 'Farm Maintenance';
    let cat = 'Maintenance';
    if (desc.includes('drug') || desc.includes('med') || desc.includes('vaccine')) cat = 'Drugs';
    else if (desc.includes('feed')) cat = 'Feed';
    else if (desc.includes('salary') || desc.includes('staff')) cat = 'Salaries';

    result.expenses.push({
      date: today,
      category: cat,
      amount: amt || 0,
      description: desc
    });
  }

  // Sales (e.g. "sold eggs for 600000")
  const salesMatch = textLower.match(/(sold|sales)\s*([a-z\s]+)?\s*(for|at|of)?\s*(₦|\$|naira)?\s*(\d+[\d,]*)(k)?/i);
  if (salesMatch) {
    let rawAmt = salesMatch[5].replace(/,/g, '');
    let amt = parseInt(rawAmt, 10);
    if (salesMatch[6] && salesMatch[6].toLowerCase() === 'k') amt *= 1000;

    let productType = salesMatch[2] ? salesMatch[2].trim() : 'Eggs';
    if (productType.includes('egg')) productType = 'Eggs';
    else if (productType.includes('bird') || productType.includes('chicken')) productType = 'Birds';

    result.sales.push({
      date: today,
      type: productType,
      quantity: 1,
      totalAmount: amt || 0,
      customerName: 'Walk-in Customer'
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
- 1 crate of eggs = 30 pieces.
- If a date is not specified, use today's date: ${today}.
- Expense categories must be one of: "Feed", "Drugs", "Salaries", "Maintenance", "Utilities".

Return a JSON object with this exact structure:
{
  "staffChanges": { "removeAll": false, "add": [] },
  "eggs": [ { "date": "YYYY-MM-DD", "goodEggs": number, "crackedEggs": number, "notes": "string" } ],
  "expenses": [ { "date": "YYYY-MM-DD", "category": "string", "amount": number, "description": "string" } ],
  "sales": [ { "date": "YYYY-MM-DD", "type": "string", "quantity": number, "totalAmount": number, "customerName": "string" } ],
  "feedUsedKg": number,
  "mortalityCount": number
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

    // Insert parsed records into Supabase under workspaceId

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

    // 5. Handle Health / Mortality
    if (parsed.mortalityCount > 0) {
      const { data: batches } = await serviceRoleClient
        .from('batches')
        .select('id, quantity')
        .eq('workspaceId', workspaceId)
        .limit(1);
      
      if (batches?.[0]) {
        const newQty = Math.max(0, (batches[0].quantity || 100) - parsed.mortalityCount);
        await serviceRoleClient.from('batches').update({ quantity: newQty }).eq('id', batches[0].id);
      }

      await serviceRoleClient.from('health').insert({
        id: crypto.randomUUID(),
        workspaceId,
        date: today,
        batchId: batches?.[0]?.id || 'main',
        mortalityCount: parsed.mortalityCount,
        symptoms: 'AI Auto-Logged Mortality',
        diagnosis: 'Routine Log',
        treatment: 'None',
        status: 'Resolved'
      });
    }

    // 6. Handle Feed Used
    if (parsed.feedUsedKg > 0) {
      await serviceRoleClient.from('feeds').insert({
        id: crypto.randomUUID(),
        workspaceId,
        date: today,
        feedType: 'Layer Mash',
        quantityKg: parsed.feedUsedKg,
        cost: 0,
        recordedBy: 'AI Auto-Logger'
      });
    }

    return NextResponse.json({ success: true, parsed, extracted: parsed });
  } catch (error: any) {
    console.error('AI Parse Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process AI parsing' }, { status: 500 });
  }
}
