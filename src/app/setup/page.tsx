import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyOwnerSession } from '@/lib/ownerAuth';
import { SetupWizardClient } from './SetupWizardClient';

export default async function SetupPage() {
  const cookieStore = await cookies();
  const isAuthorized = await verifyOwnerSession(cookieStore);

  if (!isAuthorized) {
    redirect('/setup/login');
  }

  return <SetupWizardClient />;
}
