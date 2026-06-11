import { cookies } from 'next/headers';

export async function getWorkspaceId() {
  const cookieStore = await cookies();
  return cookieStore.get('pfms_workspace')?.value || 'main';
}
