'use strict';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { isRouteAllowedForRole } from '@/lib/permissions';
import { AccessDenied } from '@/components/layout/AccessDenied';

export default async function EnterprisePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  if (!isRouteAllowedForRole('/dashboard/enterprise', role)) {
    return <AccessDenied role={role} path="/dashboard/enterprise" />;
  }

  const params = await searchParams;
  const tab = params?.tab;

  if (tab === 'whitelabel') redirect('/dashboard/enterprise/whitelabel');
  if (tab === 'apikeys' || tab === 'api') redirect('/dashboard/enterprise/api');
  if (tab === 'vet') redirect('/dashboard/enterprise/vet');
  if (tab === 'bulk' || tab === 'feed-pool') redirect('/dashboard/enterprise/feed-pool');

  redirect('/dashboard/enterprise/branches');
}
