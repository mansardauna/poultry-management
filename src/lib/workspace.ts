'use strict';
import { cookies } from 'next/headers';

/**
 * Get the current workspace ID.
 */
export async function getWorkspaceId() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('pfms_org_id')?.value;
  return cookieStore.get('pfms_workspace')?.value || (orgId ? `main-${orgId}` : 'main');
}
