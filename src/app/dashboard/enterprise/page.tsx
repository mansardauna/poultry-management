'use strict';
import { redirect } from 'next/navigation';

export default async function EnterprisePage() {
  redirect('/dashboard/enterprise/branches');
}
