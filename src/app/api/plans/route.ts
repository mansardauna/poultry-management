'use strict';

import { NextResponse } from 'next/server';
import { getPublicPlans } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  const plans = await getPublicPlans();
  return NextResponse.json(plans);
}
