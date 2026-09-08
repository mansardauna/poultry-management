'use strict';
import { ContactsClient } from "@/components/features/contacts/ContactsClient";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function ContactsPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  return <ContactsClient role={role} />;
}
