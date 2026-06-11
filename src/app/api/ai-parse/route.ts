import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text report is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Initialize report metrics
    let eggsGood = 0;
    let eggsBroken = 0;
    let eggsSpoilt = 0;
    let feedUsedKg = 0;
    let mortalityCount = 0;
    let salesAmount = 0;
    let expenseAmount = 0;

    const lowerText = text.toLowerCase();

    const eggMatch = lowerText.match(/(?:collected|good)\s*(\d+)\s*(?:eggs)?/);
    if (eggMatch) eggsGood = parseInt(eggMatch[1], 10);
    
    const brokenMatch = lowerText.match(/(?:broken|cracked)\s*(\d+)/);
    if (brokenMatch) eggsBroken = parseInt(brokenMatch[1], 10);

    const spoiltMatch = lowerText.match(/(?:spoilt|bad)\s*(\d+)/);
    if (spoiltMatch) eggsSpoilt = parseInt(spoiltMatch[1], 10);

    const feedMatch = lowerText.match(/(?:consumed|used|feed)\s*(\d+)\s*(?:kg)?/);
    if (feedMatch) feedUsedKg = parseInt(feedMatch[1], 10);

    const mortalityMatch = lowerText.match(/(?:mortality|died|death)\s*(\d+)/);
    if (mortalityMatch) mortalityCount = parseInt(mortalityMatch[1], 10);

    const salesMatch = lowerText.match(/(?:sold|revenue|sale)\s*(?:for|of)?\s*(?:₦|\$|n)?\s*(\d+)/);
    if (salesMatch) salesAmount = parseInt(salesMatch[1], 10);

    const expenseMatch = lowerText.match(/(?:expense|bought|spent|cost)\s*(?:for|of)?\s*(?:₦|\$|n)?\s*(\d+)/);
    if (expenseMatch) expenseAmount = parseInt(expenseMatch[1], 10);

    await db.transaction(async (tx) => {
      if (eggsGood > 0) {
        await tx.insert(schema.eggs).values({
          id: 'e' + Date.now(),
          date: today,
          goodEggs: eggsGood,
          brokenEggs: eggsBroken,
          spoiltEggs: eggsSpoilt,
          batchId: 'b1'
        });
      }

      if (feedUsedKg > 0) {
        await tx.insert(schema.feedLogs).values({
          id: 'fl' + Date.now(),
          date: today,
          feedId: 'f1',
          quantityConsumedKg: feedUsedKg,
          batchId: 'b1'
        });
        
        const feedsData = await tx.select().from(schema.feeds).limit(1);
        if (feedsData.length > 0) {
          await tx.update(schema.feeds)
            .set({ quantityKg: Math.max(0, feedsData[0].quantityKg - feedUsedKg) })
            .where(eq(schema.feeds.id, feedsData[0].id));
        }
      }

      if (mortalityCount > 0) {
        const batchesData = await tx.select().from(schema.batches).limit(1);
        if (batchesData.length > 0) {
          await tx.update(schema.batches)
            .set({ mortalityCount: batchesData[0].mortalityCount + mortalityCount })
            .where(eq(schema.batches.id, batchesData[0].id));
        }
      }

      if (salesAmount > 0) {
        await tx.insert(schema.sales).values({
          id: 'sa' + Date.now(),
          date: today,
          type: 'Eggs',
          quantity: 50,
          totalAmount: salesAmount,
          customerName: 'AI Log Customer',
          paymentMethod: 'Bank transfer',
          status: 'Paid'
        });
      }

      if (expenseAmount > 0) {
        await tx.insert(schema.expenses).values({
          id: 'ex' + Date.now(),
          date: today,
          category: 'Feed',
          amount: expenseAmount,
          description: 'Auto-logged expense from report'
        });
      }
    });

    return NextResponse.json({
      success: true,
      extracted: {
        eggsGood,
        eggsBroken,
        eggsSpoilt,
        feedUsedKg,
        mortalityCount,
        salesAmount,
        expenseAmount
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process AI report' }, { status: 500 });
  }
}
