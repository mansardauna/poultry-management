'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';

const DEFAULT_CMS = {
  heroHeading: 'AI-Driven poultry farms with human-level precision',
  heroSubtitle: 'Empower your farm managers with AI-driven insights to help them track flock health, predict egg yields, and perform at peak efficiency.',
  announcementBanner: '🔥 New Release: AI Voice Auto-Logger & Multi-Farm Enterprise Hub live now!',
  ctaText: 'Get Started Free',
  supportPhone: '+234 800 768 5879',
  supportEmail: 'support@pfms-poultry.com'
};

export async function GET() {
  try {
    const { data } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'landing_page_cms')
      .single();

    if (data?.adminName) {
      const parsed = JSON.parse(data.adminName);
      if (parsed && typeof parsed === 'object') {
        return NextResponse.json({ ...DEFAULT_CMS, ...parsed });
      }
    }
    return NextResponse.json(DEFAULT_CMS);
  } catch (err: any) {
    return NextResponse.json(DEFAULT_CMS);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.email === 'superadmin@pfms.com' || user?.role === 'SuperAdmin';

    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin (superadmin@pfms.com) can edit landing CMS content' }, { status: 403 });
    }

    const cmsData = await request.json();

    const { error: upsertErr } = await serviceRoleClient.from('systemSettings').upsert([{
      id: 'landing_page_cms',
      workspaceId: 'global',
      adminName: JSON.stringify(cmsData)
    }]);

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Landing page CMS content saved & published live to Supabase successfully!' });
  } catch (err: any) {
    console.error('Landing CMS Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save landing page CMS content' }, { status: 500 });
  }
}
