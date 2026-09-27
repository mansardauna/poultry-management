'use strict';

import { redirect } from 'next/navigation';
import { isSystemInstalled } from '@/lib/dbCheck';
import { SetupWizardClient } from './SetupWizardClient';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const installed = await isSystemInstalled();

  // If system is already installed and has an active database connection,
  // do not allow running the installer again.
  if (installed) {
    redirect('/login');
  }

  // First-time setup: database connection not yet provided or active.
  return <SetupWizardClient />;
}
