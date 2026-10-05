'use strict';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import { getWorkspaceId } from '@/lib/workspace';
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

  const eggCrateMatch = textLower.match(/(\d+)\s*(crates|crate)/);
  const eggPiecesMatch = textLower.match(/(\d+)\s*(good\s*)?(eggs|pieces)/);
  let totalEggs = 0;
  let crackedEggs = 0;
  let spoiltEggs = 0;

  if (eggCrateMatch) {
    totalEggs += parseInt(eggCrateMatch[1], 10) * 30;
  }
  if (eggPiecesMatch) {
    totalEggs += parseInt(eggPiecesMatch[1], 10);
  }

  const crackedMatch = textLower.match(/(\d+)\s*(cracked|broken)/);
  if (crackedMatch) {
    crackedEggs = parseInt(crackedMatch[1], 10);
  }

  const spoiltMatch = textLower.match(/(\d+)\s*(spoilt|spoiled|bad|rotten)/);
  if (spoiltMatch) {
    spoiltEggs = parseInt(spoiltMatch[1], 10);
  }

  if (totalEggs > 0 || crackedEggs > 0 || spoiltEggs > 0) {
    const rawTotal = totalEggs > 0 ? totalEggs : (crackedEggs + spoiltEggs);
    result.eggs.push({
      date: today,
      goodEggs: Math.max(0, rawTotal - crackedEggs - spoiltEggs),
      crackedEggs: crackedEggs,
      spoiltEggs: spoiltEggs,
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
    let workspaceId: string | undefined;

    // 1. Check Bearer API Key from enterprise_api_keys
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: keyRec } = await serviceRoleClient
        .from('enterprise_api_keys')
        .select('workspaceId, status')
        .eq('secretKey', token)
        .limit(1)
        .maybeSingle();

      if (keyRec && keyRec.status === 'Active') {
        workspaceId = keyRec.workspaceId;
      } else {
        return NextResponse.json({ error: 'Unauthorized: Invalid or inactive API key' }, { status: 401 });
      }
    }

    // 2. Fall back to active workspace if no Bearer key
    if (!workspaceId || workspaceId === 'org_superadmin') {
      try {
        workspaceId = await getWorkspaceId();
      } catch {}
    }
    
    // Ensure workspaceId is mapped to a real existing farm workspace
    const { data: realWs } = await serviceRoleClient
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId || '')
      .limit(1)
      .maybeSingle();

    if (!realWs) {
      const { data: firstWs } = await serviceRoleClient.from('workspaces').select('id').limit(1).maybeSingle();
      if (firstWs?.id) {
        workspaceId = firstWs.id;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace found. Provide Authorization: Bearer <API_KEY> or log in.' }, { status: 400 });
    }

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text report is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    let parsed: any = null;

    // 1. Fetch AI Configuration from systemSettings or environment
    let aiProvider = 'gemini';
    let aiApiKey = '';
    let aiModel = '';
    let aiBaseUrl = '';

    try {
      const { data: gatewayData } = await serviceRoleClient
        .from('systemSettings')
        .select('adminName')
        .eq('id', 'gateways_config')
        .maybeSingle();

      if (gatewayData?.adminName) {
        const parsedGw = typeof gatewayData.adminName === 'string'
          ? JSON.parse(gatewayData.adminName)
          : gatewayData.adminName;
        if (parsedGw && typeof parsedGw === 'object') {
          if (parsedGw.aiProvider) aiProvider = String(parsedGw.aiProvider).toLowerCase().trim();
          if (parsedGw.aiApiKey) aiApiKey = String(parsedGw.aiApiKey).trim();
          if (parsedGw.aiModel) aiModel = String(parsedGw.aiModel).trim();
          if (parsedGw.aiBaseUrl) aiBaseUrl = String(parsedGw.aiBaseUrl).trim();
        }
      }
    } catch (_e) {}

    // Fallback environment variables
    if (!aiApiKey) {
      if (aiProvider === 'gemini') aiApiKey = process.env.GEMINI_API_KEY || '';
      else if (aiProvider === 'openai') aiApiKey = process.env.OPENAI_API_KEY || '';
      else if (aiProvider === 'groq') aiApiKey = process.env.GROQ_API_KEY || '';
      else if (aiProvider === 'deepseek') aiApiKey = process.env.DEEPSEEK_API_KEY || '';
      else if (aiProvider === 'anthropic') aiApiKey = process.env.ANTHROPIC_API_KEY || '';
      else if (aiProvider === 'openrouter') aiApiKey = process.env.OPENROUTER_API_KEY || '';
      else if (aiProvider === 'mistral') aiApiKey = process.env.MISTRAL_API_KEY || '';
      else if (aiProvider === 'xai') aiApiKey = process.env.XAI_API_KEY || '';
      else if (aiProvider === 'cohere') aiApiKey = process.env.COHERE_API_KEY || '';
      else if (aiProvider === 'perplexity') aiApiKey = process.env.PERPLEXITY_API_KEY || '';
      else if (aiProvider === 'ollama') aiApiKey = 'ollama-local';
      else aiApiKey = process.env.GEMINI_API_KEY || '';
    }

    if (aiProvider === 'gemini') {
      if (!aiModel || aiModel === 'gemini-2.0-flash' || aiModel === 'gemini-1.5-flash' || aiModel === 'gemini-2.5-flash') {
        aiModel = 'gemini-3.5-flash';
      }
    }

    if (aiApiKey) {
      try {
        const systemPrompt = `You are a Poultry Farm Management AI Assistant. Your job is to extract data from natural language daily reports and output them in strict JSON format. 
Here are the farm rules:
- 1 crate of eggs = 30 pieces.
- If a date is not specified, use today's date: ${today}.
- Expense categories must be one of: "Feed", "Drugs", "Salaries", "Maintenance", "Utilities".
- For eggs: categorize intact/clean eggs as goodEggs, broken/cracked eggs as crackedEggs, and spoiled/bad/rotten eggs as spoiltEggs.

Return a JSON object with this exact structure:
{
  "staffChanges": { "removeAll": false, "add": [] },
  "eggs": [ { "date": "YYYY-MM-DD", "goodEggs": number, "crackedEggs": number, "spoiltEggs": number, "notes": "string" } ],
  "expenses": [ { "date": "YYYY-MM-DD", "category": "string", "amount": number, "description": "string" } ],
  "sales": [ { "date": "YYYY-MM-DD", "type": "string", "quantity": number, "totalAmount": number, "customerName": "string" } ],
  "feedUsedKg": number,
  "mortalityCount": number
}`;

        // OpenAI-compatible providers registry
        const openAiCompatibleEndpoints: Record<string, { url: string; defaultModel: string; extraHeaders?: Record<string, string> }> = {
          openai: {
            url: 'https://api.openai.com/v1/chat/completions',
            defaultModel: 'gpt-4o-mini',
          },
          groq: {
            url: 'https://api.groq.com/openai/v1/chat/completions',
            defaultModel: 'llama-3.3-70b-versatile',
          },
          deepseek: {
            url: 'https://api.deepseek.com/chat/completions',
            defaultModel: 'deepseek-chat',
          },
          openrouter: {
            url: 'https://openrouter.ai/api/v1/chat/completions',
            defaultModel: 'google/gemini-2.0-flash-001',
            extraHeaders: {
              'HTTP-Referer': 'https://pfms-poultry.com',
              'X-Title': 'PFMS Multi-Tenant AI Gateway',
            }
          },
          mistral: {
            url: 'https://api.mistral.ai/v1/chat/completions',
            defaultModel: 'mistral-small-latest',
          },
          xai: {
            url: 'https://api.x.ai/v1/chat/completions',
            defaultModel: 'grok-beta',
          },
          perplexity: {
            url: 'https://api.perplexity.ai/chat/completions',
            defaultModel: 'sonar',
          },
          ollama: {
            url: `${(aiBaseUrl || 'http://localhost:11434').replace(/\/+$/, '')}/v1/chat/completions`,
            defaultModel: 'llama3.2',
          },
        };

        if (aiProvider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: aiApiKey });
          const response = await ai.models.generateContent({
            model: aiModel || 'gemini-2.0-flash',
            contents: text,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
            }
          });

          if (response.text) {
            parsed = JSON.parse(response.text);
          }
        } else if (openAiCompatibleEndpoints[aiProvider]) {
          const target = openAiCompatibleEndpoints[aiProvider];
          const res = await fetch(target.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${aiApiKey}`,
              ...(target.extraHeaders || {}),
            },
            body: JSON.stringify({
              model: aiModel || target.defaultModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
              ],
              ...(aiProvider !== 'perplexity' ? { response_format: { type: 'json_object' } } : {})
            })
          });

          if (res.ok) {
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            if (content) {
              const clean = content.replace(/```json/gi, '').replace(/```/g, '').trim();
              parsed = JSON.parse(clean);
            }
          }
        } else if (aiProvider === 'anthropic') {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': aiApiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: aiModel || 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              system: systemPrompt + ' Output ONLY raw valid JSON, with no markdown ticks or explanation.',
              messages: [
                { role: 'user', content: text }
              ]
            })
          });

          if (res.ok) {
            const data = await res.json();
            const rawText = data?.content?.[0]?.text;
            if (rawText) {
              const clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
              parsed = JSON.parse(clean);
            }
          }
        } else if (aiProvider === 'cohere') {
          const res = await fetch('https://api.cohere.com/v2/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${aiApiKey}`
            },
            body: JSON.stringify({
              model: aiModel || 'command-r-plus',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
              ],
              response_format: { type: 'json_object' }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const textMsg = data?.message?.content?.[0]?.text;
            if (textMsg) {
              const clean = textMsg.replace(/```json/gi, '').replace(/```/g, '').trim();
              parsed = JSON.parse(clean);
            }
          }
        }
      } catch (_providerError) {
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
            breed: 'ISA Brown',
            type: 'Layers',
            quantity: 100,
            purchaseDate: today,
            ageInWeeks: 20,
            mortalityCount: 0,
            vaccinationStatus: 'Up to Date',
            farmSection: 'Layer House 1'
         });
      }

      const eggInsert = parsed.eggs.map((e: any) => ({
        id: crypto.randomUUID(),
        workspaceId,
        batchId,
        date: e.date || today,
        goodEggs: Number(e.goodEggs) || 0,
        brokenEggs: Number(e.crackedEggs ?? e.brokenEggs) || 0,
        spoiltEggs: Number(e.spoiltEggs ?? e.spoiledEggs) || 0,
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

    // 5. Handle Health / Mortality on Batches
    if (parsed.mortalityCount > 0) {
      const { data: batches } = await serviceRoleClient
        .from('batches')
        .select('*')
        .eq('workspaceId', workspaceId)
        .limit(1);
      
      if (batches?.[0]) {
        const curMort = Number(batches[0].mortalityCount) || 0;
        const curQty = Number(batches[0].quantity) || 100;
        await serviceRoleClient.from('batches').update({
          quantity: Math.max(0, curQty - parsed.mortalityCount),
          mortalityCount: curMort + parsed.mortalityCount
        }).eq('id', batches[0].id);
      }
    }

    // 6. Handle Feed Used
    if (parsed.feedUsedKg > 0) {
      await serviceRoleClient.from('feeds').insert({
        id: crypto.randomUUID(),
        workspaceId,
        type: 'Layer Mash',
        quantityKg: parsed.feedUsedKg,
        supplier: 'AI Auto-Logger',
        lastRestock: today
      });
    }

    return NextResponse.json({ success: true, parsed, extracted: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process AI parsing' }, { status: 500 });
  }
}
