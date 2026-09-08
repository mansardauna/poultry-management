import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CCTVLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const tier = headersList.get('x-user-tier') || 'free';

  // Strict server-side check to prevent direct URL access to Pro features
  if (tier === 'free') {
    redirect('/dashboard/settings');
  }

  return <>{children}</>;
}
