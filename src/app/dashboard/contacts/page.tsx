'use strict';
import { ContactsClient } from "@/components/features/contacts/ContactsClient";
import { getAuthUser } from '@/lib/auth';

/** Exported function default */
export default async function ContactsPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  return <ContactsClient role={role} />;
}
