'use strict';
import { redirect } from 'next/navigation';

export default async function EnterprisePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const tab = params?.tab;

  if (tab === 'whitelabel') redirect('/dashboard/enterprise/whitelabel');
  if (tab === 'apikeys' || tab === 'api') redirect('/dashboard/enterprise/api');
  if (tab === 'vet') redirect('/dashboard/enterprise/vet');
  if (tab === 'bulk' || tab === 'feed-pool') redirect('/dashboard/enterprise/feed-pool');

  redirect('/dashboard/enterprise/branches');
}
