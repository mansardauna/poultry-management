'use strict';
import { cookies } from 'next/headers';

/**
 * Get the current workspace ID.
 */
export async function getWorkspaceId() {
  const cookieStore = await cookies();
  return cookieStore.get('pfms_workspace')?.value || 'main';
}
