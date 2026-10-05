'use strict';

import { NextResponse } from 'next/server';
import { getPublicPlans } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency') || undefined;
  const rateParam = searchParams.get('rate');
  const rate = rateParam ? Number(rateParam) : undefined;

  const plans = await getPublicPlans(currency, rate);
  return NextResponse.json(plans);
}
