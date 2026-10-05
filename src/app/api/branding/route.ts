'use strict';

import { NextResponse } from 'next/server';
import { getPublicBranding } from '@/lib/branding';

export const dynamic = 'force-dynamic';

export async function GET() {
  const branding = await getPublicBranding();
  return NextResponse.json(branding);
}
